import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface NetworkConstructProps {
  maxAzs?: number;
  natGateways?: number;
}

export class NetworkConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkConstructProps = {}) {
    super(scope, id);

    const { maxAzs = 2, natGateways = 1 } = props;

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs,
      natGateways,
    });
  }
}
