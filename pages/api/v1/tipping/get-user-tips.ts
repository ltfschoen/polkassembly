// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { NextApiHandler } from 'next';
import withErrorHandling from '~src/api-middlewares/withErrorHandling';
import { isValidNetwork } from '~src/api-utils';
import { MessageType } from '~src/auth/types';
import messages from '~src/auth/utils/messages';
import { firestore_db } from '~src/services/firebaseInit';
import getSubstrateAddress from '~src/util/getSubstrateAddress';

export interface ITip {
	created_at: Date;
	remark: string;
	network: string;
	tip_from: string;
	tip_to: string;
	user_id: number;
	amount: number;
	token: string;
	extrinsic_hash: any;
}
export enum ETipStatus {
	GIVEN = 'Given',
	RECEIVED = 'Received'
}
const handler: NextApiHandler<ITip[] | MessageType> = async (req, res) => {
	if (req.method !== 'POST') return res.status(405).json({ message: 'Invalid request method, POST required.' });

	const network = String(req.headers['x-network']);
	if (!network || !isValidNetwork(network)) return res.status(400).json({ message: messages.INVALID_NETWORK });

	const { addresses, tipStatus } = req.body;
	if (!Array.isArray(addresses) || !addresses.length || !tipStatus) return res.status(400).json({ message: messages.INVALID_PARAMS });

	const field = tipStatus === ETipStatus.GIVEN ? 'tip_from' : 'tip_to';
	const tippingsSnapshot = await firestore_db
		.collection('tippings')
		.where(
			field,
			'in',
			addresses.map((address: string) => getSubstrateAddress(address))
		)
		.where('network', '==', network)
		.get();

	const tippings = tippingsSnapshot?.docs?.map((tip) => {
		const data: any = tip.data();
		const newData = {
			...data,
			created_at: data?.created_at.toDate ? data?.created_at.toDate() : data?.created_at
		};
		return newData;
	});

	return res.status(200).json(tippings as ITip[]);
};

export default withErrorHandling(handler);
