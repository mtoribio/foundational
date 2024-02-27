import * as cdk from 'aws-cdk-lib';
import { PipelineProject, BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { createName } from '../../bin/foundational';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface CiCdBuildProjectsProps {
	env: {
		region: string;
		project: string;
		environment: string;
		ownerAccount: string;
		cicdRepo: string;
		cicdBranch: string;
	};
}

export const cicdBuildProjects = (scope: Construct, props: CiCdBuildProjectsProps) => {
	// Crear un CodeBuild para Linting
	const linter = new PipelineProject(scope, 'CodeBuildCiCdProjectLinting', {
		projectName: createName('codebuild', 'cicd-linting'),
		environment: {
			buildImage: LinuxBuildImage.STANDARD_7_0,
		},
		timeout: cdk.Duration.minutes(100),
		buildSpec: BuildSpec.fromObject({
			version: '0.2',
			phases: {
				install: {
					'runtime-versions': {
						nodejs: '18',
					},
					commands: ['node -v', 'npm install'],
				},
				build: {
					commands: ['npm run eslint'],
				},
			},
		}),
	});

	// Crear un CodeBuild para Synth
	const synth = new PipelineProject(scope, 'CodeBuildCiCdProjectSynth', {
		projectName: createName('codebuild', 'cicd-synth'),
		environment: {
			buildImage: LinuxBuildImage.STANDARD_7_0,
		},
		timeout: cdk.Duration.minutes(100),
		buildSpec: BuildSpec.fromObject({
			version: '0.2',
			phases: {
				install: {
					'runtime-versions': {
						nodejs: '18',
					},
					commands: ['node -v', 'sudo npm install -g aws-cdk', 'npm install'],
				},
				build: {
					commands: [`cdk synth -c config=${props.env.environment}`],
				},
			},
		}),
	});

	// Crear un CodeBuild para Deploy
	const deploy = new PipelineProject(scope, 'CodeBuildCiCdProjectDeploy', {
		projectName: createName('codebuild', 'cicd-deploy'),
		environment: {
			buildImage: LinuxBuildImage.STANDARD_7_0,
		},
		timeout: cdk.Duration.minutes(100),
		buildSpec: BuildSpec.fromObject({
			version: '0.2',
			phases: {
				install: {
					'runtime-versions': {
						nodejs: '18',
					},
					commands: ['node -v', 'sudo npm install -g aws-cdk', 'npm install'],
				},
				build: {
					commands: [`cdk deploy --all -c config=${props.env.environment} --method=direct --require-approval never`],
				},
			},
		}),
	});

	// Conceder permisos al CodeBuild project de deploy
	deploy.addToRolePolicy(
		new iam.PolicyStatement({
			actions: ['sts:AssumeRole'],
			resources: ['*'],
		})
	);

	return {
		linter,
		synth,
		deploy,
	};
};
