import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { Construct } from 'constructs';
import { createName } from '../bin/foundational';
import { Pipeline, PipelineType } from 'aws-cdk-lib/aws-codepipeline';
import { cicdBuildActions } from './pipelinebuildactions/cicd-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface CiCdBuildActionsProps extends cdk.StackProps {
	env: {
		region: string;
		project: string;
		environment: string;
		ownerAccount: string;
		cicdRepo: string;
		cicdBranch: string;
	};
}

export class CiCdPipelineStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: CiCdBuildActionsProps) {
		super(scope, id, props);

		// Crear un CodeCommit repository
		new codecommit.Repository(this, 'CiCdRepository', {
			repositoryName: createName('codecommit', 'cicd-repo'),
		});

		// Crear el bucket S3 para los Artefactos
		const s3ArtifactsBucket = new s3.Bucket(this, 'S3Bucket', {
			bucketName: createName('s3', 'cicd-pipeline-artifacts'),
			enforceSSL: true,
			accessControl: s3.BucketAccessControl.PRIVATE,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			encryption: s3.BucketEncryption.S3_MANAGED,
		});

		// Crear los build actions
		const actions = cicdBuildActions(this, props);

		// Create CodePipeline
		new Pipeline(this, 'CiCdPipeline', {
			pipelineName: createName('codepipeline', 'cicd-pipeline'),
			pipelineType: PipelineType.V1,
			artifactBucket: s3ArtifactsBucket,
			enableKeyRotation: true,
			stages: [
				{
					stageName: createName('stage', 'source'),
					actions: [actions.source],
				},
				{
					stageName: createName('stage', 'linting'),
					actions: [actions.linting],
				},
				{
					stageName: createName('stage', 'synth'),
					actions: [actions.synth],
				},
				{
					stageName: createName('stage', 'deploy'),
					actions: [actions.deploy],
				},
			],
		});
	}
}
