#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FoundationalStack } from '../lib/foundational-stack';

const app = new cdk.App();
new FoundationalStack(app, 'FoundationalStack');
