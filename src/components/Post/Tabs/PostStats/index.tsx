// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { FC, useContext, useEffect, useCallback, useState } from 'react';
import BN from 'bn.js';
import { ProposalType, getSubsquidLikeProposalType } from '~src/global/proposalType';
import { ApiContext } from 'src/context/ApiContext';
import { usePostDataContext } from '~src/context';
import { useFetch } from 'src/hooks';
import { chainProperties } from '~src/global/networkConstants';
import { subscanApiHeaders } from 'src/global/apiHeaders';
import { useNetworkSelector } from '~src/redux/selectors';
import { IVotesCount, LoadingStatusType } from 'src/types';
import nextApiClientFetch from '~src/util/nextApiClientFetch';
import { ApiPromise } from '@polkadot/api';
import { getVotingTypeFromProposalType } from '~src/global/proposalType';
import { IAllVotesType } from 'pages/api/v1/votes/total';
import { StatTabs } from './Tabs/StatTabs';
import ConvictionVotes from './Tabs/ConvictionVotes';
import VoteAmount from './Tabs/VoteAmount';
import Accounts from './Tabs/Accounts';
import { Skeleton } from 'antd';
import NoVotesIcon from '~assets/icons/analytics/no-votes.svg';

interface IPostStatsProps {
	postId: string;
	postType: ProposalType;
	tally?: any;
	proposalId?: number;
	statusHistory?: any;
}

const ZERO = new BN(0);

const PostStats: FC<IPostStatsProps> = ({ proposalId, postId, postType, statusHistory, tally }: IPostStatsProps) => {
	const { network } = useNetworkSelector();
	const { api, apiReady } = useContext(ApiContext);

	const isReferendum2 = postType === ProposalType.REFERENDUM_V2;
	const {
		postData: { postIndex }
	} = usePostDataContext();
	const [tallyData, setTallyData] = useState({
		abstain: ZERO,
		ayes: ZERO,
		nays: ZERO
	});
	const [noVotes, setNoVotes] = useState<boolean>(false);

	const [totalVotesCount, setTotalVotesCount] = useState<IVotesCount>({ abstain: 0, ayes: 0, nays: 0 });

	const [loadingStatus, setLoadingStatus] = useState<LoadingStatusType>({ isLoading: true, message: 'Loading votes' });
	const [activeIssuance, setActiveIssuance] = useState<any>(0);
	const [support, setSupport] = useState<BN | undefined>(ZERO);
	const voteType = getVotingTypeFromProposalType(postType);
	const [allVotes, setAllVotes] = useState<IAllVotesType>();
	const [activeTab, setActiveTab] = useState<string>('conviction-votes');
	const [turnout, setTurnout] = useState<BN | null>(null);

	const handleAyeNayCount = async () => {
		setLoadingStatus({ ...loadingStatus, isLoading: true });
		const { data, error } = await nextApiClientFetch<{ aye: { totalCount: number }; nay: { totalCount: number }; abstain: { totalCount: number } }>(
			'/api/v1/votes/ayeNayTotalCount',
			{
				postId: postId,
				proposalType: getSubsquidLikeProposalType(postType)
			}
		);
		if (data) {
			setTotalVotesCount({ abstain: data.abstain.totalCount, ayes: data.aye.totalCount, nays: data.nay.totalCount });
			setLoadingStatus({ ...loadingStatus, isLoading: false });
		} else {
			console.log(error);
			setLoadingStatus({ ...loadingStatus, isLoading: false });
		}
	};

	const { data: voteInfoData, error: voteInfoError } = useFetch<any>(`${chainProperties[network]?.externalLinks}/api/scan/democracy/referendum`, {
		body: JSON.stringify({
			referendum_index: proposalId
		}),
		headers: subscanApiHeaders,
		method: 'POST'
	});

	const getVoteInfo = useCallback(async () => {
		if (!api || !apiReady || !network) return;

		let newAPI: ApiPromise = api;
		const status = (statusHistory || [])?.find((v: any) => ['Rejected', 'TimedOut', 'Confirmed'].includes(v?.status || ''));

		if (status) {
			const blockNumber = status.block;
			if (blockNumber) {
				const hash = await api.rpc.chain.getBlockHash(blockNumber - 1);
				newAPI = (await api.at(hash)) as ApiPromise;
			}
		}

		(async () => {
			if (network === 'picasso') {
				const totalIssuance = await api.query.openGovBalances.totalIssuance();
				const inactiveIssuance = await api.query.openGovBalances.inactiveIssuance();
				setActiveIssuance((totalIssuance as any).sub(inactiveIssuance));
			} else {
				const totalIssuance = await api.query.balances.totalIssuance();
				const inactiveIssuance = await api.query.balances.inactiveIssuance();
				setActiveIssuance(totalIssuance.sub(inactiveIssuance));
			}
		})();

		if (isReferendum2) {
			const referendumInfoOf = await newAPI.query.referenda.referendumInfoFor(postId);
			const parsedReferendumInfo: any = referendumInfoOf.toJSON();
			if (parsedReferendumInfo?.ongoing?.tally) {
				setTallyData({
					abstain:
						typeof parsedReferendumInfo.ongoing.tally.abstain === 'string'
							? new BN(parsedReferendumInfo.ongoing.tally.abstain.slice(2), 'hex')
							: new BN(parsedReferendumInfo.ongoing.tally.abstain),
					ayes:
						typeof parsedReferendumInfo.ongoing.tally.ayes === 'string'
							? new BN(parsedReferendumInfo.ongoing.tally.ayes.slice(2), 'hex')
							: new BN(parsedReferendumInfo.ongoing.tally.ayes),
					nays:
						typeof parsedReferendumInfo.ongoing.tally.nays === 'string'
							? new BN(parsedReferendumInfo.ongoing.tally.nays.slice(2), 'hex')
							: new BN(parsedReferendumInfo.ongoing.tally.nays)
				});
			}
		} else {
			setTallyData({
				abstain: new BN(tally?.abstain || 0, 'hex'),
				ayes: new BN(tally?.ayes || 0, 'hex'),
				nays: new BN(tally?.nays || 0, 'hex')
			});
		}
	}, [api, apiReady, isReferendum2, network, postId, statusHistory, tally]);

	useEffect(() => {
		setLoadingStatus({
			isLoading: true,
			message: 'Loading votes'
		});

		(async () => {
			await nextApiClientFetch<IAllVotesType>('api/v1/votes/total', {
				postId: postId,
				voteType: voteType
			})
				.then((res) => {
					if (res.error) {
						console.log(res.error);
						setLoadingStatus({
							isLoading: false,
							message: ''
						});
					} else {
						const votesRes = res.data;
						if (votesRes?.totalCount === 0) {
							setNoVotes(true);
						}
						setAllVotes(votesRes);

						const support = votesRes?.data.reduce((acc, vote) => {
							if (!acc) acc = ZERO;

							if (vote.decision === 'yes' || vote.decision !== 'no') {
								acc = acc.add(new BN(vote.balance));
							}
							return acc;
						}, new BN(0));

						setSupport(support);

						setLoadingStatus({
							isLoading: false,
							message: ''
						});
					}
				})
				.catch((err) => {
					console.log(err);
					setLoadingStatus({
						isLoading: false,
						message: ''
					});
				});
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [postId, voteType]);

	useEffect(() => {
		handleAyeNayCount();
		(async () => {
			await getVoteInfo();
		})();

		if (!voteInfoError && voteInfoData && voteInfoData.data && voteInfoData.data.info) {
			const info = voteInfoData.data.info;

			if (!tally) {
				setTallyData({
					abstain: new BN(info.abstain_amount),
					ayes: new BN(info.aye_amount),
					nays: new BN(info.nay_amount)
				});
			}
			postType === ProposalType.REFERENDUMS && setTurnout(new BN(info.turnout));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [postIndex, voteInfoData, voteInfoError]);

	const tabItems: any[] = [
		{
			children: (
				<ConvictionVotes
					support={support || ZERO}
					activeIssuance={activeIssuance}
					tallyData={tallyData}
					allVotes={allVotes}
					turnout={turnout ? new BN(turnout) : null}
				/>
			),
			key: 'conviction-votes',
			label: 'Conviction Votes'
		},
		{
			children: (
				<VoteAmount
					activeIssuance={activeIssuance}
					allVotes={allVotes}
					support={support || ZERO}
					turnout={turnout ? new BN(turnout) : null}
				/>
			),
			key: 'vote-amount',
			label: 'Vote Amount'
		},
		{
			children: (
				<Accounts
					support={support || ZERO}
					turnout={turnout ? new BN(turnout) : null}
					activeIssuance={activeIssuance}
					allVotes={allVotes}
					totalVotesCount={totalVotesCount}
				/>
			),
			key: 'accounts',
			label: 'Accounts'
		}
	];

	return activeIssuance ? (
		noVotes ? (
			<div className='flex flex-col items-center justify-center gap-5 p-10'>
				<NoVotesIcon />
				<p className='text-sm'>No votes have been casted yet</p>
			</div>
		) : (
			<>
				<StatTabs
					items={tabItems}
					setActiveTab={setActiveTab}
					activeTab={activeTab}
				/>
				{tabItems.map((item) => {
					if (item.key === activeTab) {
						return item.children;
					}
				})}
			</>
		)
	) : (
		<Skeleton active />
	);
};

export default PostStats;