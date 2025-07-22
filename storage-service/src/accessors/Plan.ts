import client from './prisma';
import type { createPlan } from 'src/types/database/Plan';

export async function createPlan(data: createPlan) {
	return client.plan.create({
		data,
	});
}

export async function fetchDefaultPlan() {
	return client.plan.findFirst({
		where: {
			isDefault: true,
		},
	});
}

export async function fetchAllPlans() {
	return client.plan.findMany();
}