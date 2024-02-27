import { Artifact } from 'aws-cdk-lib/aws-codepipeline';
import { CodeStarConnectionsSourceAction, CodeBuildAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { cicdBuildProjects } from '../pipelinebuildprojects/cicd-projects';
import { createName } from '../../bin/foundational';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface CiCdBuildActionsProps {
	env: {
		region: string;
		project: string;
		environment: string;
		ownerAccount: string;
		cicdRepo: string;
		cicdBranch: string;
	};
}

export const cicdBuildActions = (scope: Construct, props: CiCdBuildActionsProps) => {
	// Crear los build projects
	const projects = cicdBuildProjects(scope, props);

	// Conectar al repositorio en Github
	const nameParameter = createName('ps', 'conn-arn');
	const connectionArn = ssm.StringParameter.fromStringParameterName(scope, 'ConnARN', nameParameter).stringValue;

	// Artifact del Source
	const nameSourceArtifact = createName('artifact', 'cicd-source');
	const sourceArtifact = new Artifact(nameSourceArtifact);
	// CodeStarConnections action
	const source = new CodeStarConnectionsSourceAction({
		actionName: createName('codepipeline', 'cicd-github-conn'),
		owner: props.env.ownerAccount,
		repo: props.env.cicdRepo,
		output: sourceArtifact,
		branch: props.env.cicdBranch,
		triggerOnPush: true,
		connectionArn,
	});

	// CodeBuild action Linting
	const linting = new CodeBuildAction({
		actionName: createName('codebuild', 'cicd-linting-action'),
		project: projects.linter,
		input: sourceArtifact,
	});

	// CodeBuild action Synth
	const synth = new CodeBuildAction({
		actionName: createName('codebuild', 'cicd-synth-action'),
		project: projects.synth,
		input: sourceArtifact,
	});

	// CodeBuild action Deploy
	const deploy = new CodeBuildAction({
		actionName: createName('codebuild', 'cicd-deploy-action'),
		project: projects.deploy,
		input: sourceArtifact,
	});

	return {
		source,
		linting,
		synth,
		deploy,
	};
};
