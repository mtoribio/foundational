interface Environment {
	region: string;
	project: string;
	environment: string;
	ownerAccount: string;
	cicdRepo: string;
	cicdBranch: string;
}

export const environments: { [key: string]: Environment } = {
	dev: {
		region: 'us-east-2',
		project: 'hrmgo',
		environment: 'dev',
		ownerAccount: 'overalldev',
		cicdRepo: 'HRMGO_PIPELINE',
		cicdBranch: 'development',
	},

	prod: {
		region: 'us-east-2',
		project: 'hrmgo',
		environment: 'prod',
		ownerAccount: 'overalldev',
		cicdRepo: 'HRMGO_PIPELINE',
		cicdBranch: 'main',
	},
};
