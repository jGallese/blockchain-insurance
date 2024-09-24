'use strict'

const { Contract } = require('fabric-contract-api');

class InsuranceContract extends Contract {

    async initLedger(ctx) {
        const clientRole = this.getClientIdentity(ctx);
        if (clientRole !== 'InsuranceAdmin') {
            throw new Error('Only an insurance admin can init a ledger')
        }

        console.info("start ledger")
        const insurances = [
            {
                insuranceId: 'INS-001',
                policyDetails: {
                    policyNumber: 'P-001',
                    insuredName: 'John Doe',
                    coverageAmount: 100000,
                    premiumAmount: 1000,
                    startDate: '2021-01-01',
                    endDate: '2022-01-01'
                },
                status: 'Active',
                claims: [],
            },
            {insuranceId: 'INS-002',
                policyDetails: {
                    policyNumber: 'P-002',
                    insuredName: 'John Gallese',
                    coverageAmount: 50000,
                    premiumAmount: 500,
                    startDate: '2021-06-01',
                    endDate: '2022-06-01'
                },
                status: 'Active',
                claims: [],

            }

        ];

        for (const insurance of insurances) {
            await ctx.stub.putState(insurance.insuranceId,
                Buffer.from(JSON.stringify(insurance)));
                console.log("Added");
                console.info(insurance.insuranceId);
        }
        console.info("end initializing wallet");

    }



    async createInsurance(ctx, insuranceId, policyDetails) {
        const clientRole = this.getClientIdentity(ctx);

        if (clientRole !== "Customer" && clientRole !== "InsuranceAgent") {
            throw new Error(`Only Customers and Insurance Agents can create insurance policies`);
        }

        const policy = {insuranceId,
        policyDetails: JSON.parse(policyDetails),
        status: 'Active',
        claims: [],
        };


        await ctx.stub.putState(insuranceId, Buffer.from(JSON.stringify(policy)));
        console.log(`Insurance Policy ${insuranceId} created by ${clientRole}`);
        
    }

    async getInsurance(ctx, insuranceId, insuredName) {
        const clientRole = this.getClientIdentity(ctx);
        const insuranceAsBytes = await ctx.stub.getState(insuranceId);

        if(!insuranceAsBytes || insuranceAsBytes.length === 0) {
            throw new Error(`${insuranceId} does not exist`);
        }

        const insurance = JSON.parse(insuranceAsBytes.toString())

        if(clientRole === 'Customer') {
            if (insuredName !== insurance.policyDetails.insuredName) {
                throw new Error(' Customers can only access their own insurance policies');
            }

        }

        return insuranceAsBytes.toString();

    }

    async fileClaim(ctx, insuranceId, insuredName, claimDetails) {
        const clientRole = this.getClientIdentity(ctx);

        if (clientRole !== 'Customer') {
            throw new Error('Only customers can file claims');
        }

        const insuranceAsBytes = await ctx.stub.getState(insuranceId);
        if(!insuranceAsBytes || insuranceAsBytes.length === 0) {
            throw new Error(`${insuranceId} does not exist`);
        }

        const insurance = JSON.parse(insuranceAsBytes.toString())

        if (insuredName !== insurance.policyDetails.insuredName) {
            throw new Error('Customers can only file claims on their own policies');
        }

        const claims = insurance.claims || [];
        claims.push(JSON.parse(claimDetails));
        insurance.claims = claims;

        await ctx.stub.putState(insuranceId, Buffer.from(JSON.stringify(insurance)));
        console.log(`Claim filed for insurance ${insuranceId} by ${insuredName}`);

    }

    async evaluateClaim(ctx, insuranceId, claimIndex, decision) {
        const clientRole = this.getClientIdentity(ctx);

        if(clientRole !== 'InsuranceAgent' && clientRole !=='InsuranceAdmin') {
            throw new Error('Only insurance agents and insurance admins can evaluate claims');
        }

        const insuranceAsBytes = await ctx.stub.getState(insuranceId);
        if(!insuranceAsBytes || insuranceAsBytes.length === 0) {
            throw new Error(`${insuranceId} does not exist`);
        }
        
        const insurance = JSON.parse(insuranceAsBytes.toString());
        if(insurance.claims && insurance.claims.length > claimIndex) {
            insurance.claims[claimIndex].status = decision;

            await ctx.stub.putState(insurance, Buffer.from(JSON.stringify(insurance)));
            console.info(`Claim ${claimIndex} for insurance ${insuranceId} evaluated as ${decision}`);

        } else {
            throw new Error('Invalid claim index');
        }
    }

    async payClaim(ctx, insuranceId, claimIndex, amount) {
        const clientRole = this.getClientIdentity(ctx);

        if (clientRole !== 'InsuranceAgent' && clientRole !== 'InsuranceAdmin') {
            throw new Error('Only InsuranceAgents and InsuranceAdmins can pay claims');

        }

        const insurance = JSON.parse(insuranceAsBytes.toString());

        if(insurance.claims && insurance.claims.length === 0) {
            if (insurance.claims[claimIndex].status === 'Approved') {
                insurance.claims[claimIndex].paidAmount = amount;
                await ctx.stub.putState( insuranceId, Buffer.from(JSON.stringify(insurance)));
                console.log(`Claim ${claimIndex} for insurance ${insuranceID} paid amount ${amount}`);
            } else {
                throw new Error('Claim is not approved for payment')
            }
            } else {
               throw new Error('Invalid claim index')
        }
    }
     
    getClientIdentity(ctx) {
            return ctx.clientIdentity.attrs["hf.EnrollmentID"];
        }

}

module.exports = InsuranceContract;
