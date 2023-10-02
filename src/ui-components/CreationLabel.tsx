// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ClockCircleOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Divider, Dropdown, MenuProps, Modal, Tooltip } from 'antd';
import React, { FC, ReactNode, useState } from 'react';
import getRelativeCreatedAt from 'src/util/getRelativeCreatedAt';
import { poppins } from 'pages/_app';
import { network as AllNetworks } from '~src/global/networkConstants';

import NameLabel from './NameLabel';
import TopicTag from './TopicTag';
// import dayjs from 'dayjs';
import { getSentimentIcon, getSentimentTitle } from './CommentHistoryModal';
import { WarningMessageIcon } from '~src/ui-components/CustomIcons';
import Link from 'next/link';
import HelperTooltip from './HelperTooltip';
import styled from 'styled-components';
import { ESentiment, EVoteDecisionType } from '~src/types';
import { DislikeFilled, LikeFilled } from '@ant-design/icons';
import AbstainGray from '~assets/icons/abstainGray.svg';
import SplitYellow from '~assets/icons/split-yellow-icon.svg';
import CloseCross from '~assets/icons/close-cross-icon.svg';
import { parseBalance } from '~src/components/Post/GovernanceSideBar/Modal/VoteData/utils/parseBalaceToReadable';
import { useNetworkContext } from '~src/context';

const Styled = styled.div`
	padding: 0;
	margin: 0;
	margin-top: -2px;
	margin-right: 8px;
	& svg {
		width: 14.6px;
		height: 14.6px;
	}
	&:hover {
		color: #e5007a;
	}
	.ant-tooltip {
		font-size: 16px;
	}
	.ant-tooltip .ant-tooltip-placement-leftTop {
		height: 10px;
		padding: 0px;
	}
	.ant-tooltip .ant-tooltip-inner {
		min-height: 0;
	}
	.ant-tooltip-arrow {
		display: none;
	}
	.ant-tooltip-inner {
		color: black;
		font-size: 10px;
		padding: 0px 6px;
	}
	.dark-pink {
		color: #e5007a;
		text-decoration: underline;
	}

	@media (max-width: 468px) and (min-width: 319px) {
		.ant-menu-root > li:first-child {
			height: 2px !important;
		}

		.ant-modal-body {
			width: 338px;
			margin-left: -12px;
		}

		.amount-container {
			left: 58px !important;
		}

		.conviction-container {
			left: 68px !important;
		}

		.amount-value {
			left: 33px !important;
		}

		.conviction-value {
			left: 20px !important;
		}

		.power-value {
			left: 20px !important;
		}

		.abstain-amount-value {
			left: -2px !important;
		}

		.abstain-conviction-value {
			left: -14px !important;
		}

		.abstain-power-value {
			left: -15px !important;
		}
	}
`;

interface ICreationLabelProps {
	className?: string;
	children?: ReactNode;
	created_at?: Date;
	defaultAddress?: string | null;
	text?: string;
	topic?: string;
	username?: string;
	sentiment?: number;
	commentSource?: 'polkassembly' | 'subsquare';
	cid?: string;
	spam_users_count?: number;
	truncateUsername?: boolean;
	vote?: string | null;
	votesArr?: any;
	isRow?: boolean;
	voteData?: any;
}

const CreationLabel: FC<ICreationLabelProps> = (props) => {
	const {
		className,
		children,
		created_at,
		text,
		username,
		defaultAddress,
		topic,
		sentiment,
		commentSource = 'polkassembly',
		cid,
		spam_users_count = 0,
		truncateUsername,
		vote,
		votesArr = [],
		isRow,
		voteData
	} = props;
	console.log(voteData, vote);
	const relativeCreatedAt = getRelativeCreatedAt(created_at);
	const [showVotesModal, setShowVotesModal] = useState(false);
	const { network } = useNetworkContext();
	const getSentimentLabel = (sentiment: ESentiment) => {
		return <div className={`${poppins.variable} ${poppins.className} bg-pink-100 pl-1 pr-1 text-[10px] font-light leading-4 tracking-wide`}>{getSentimentTitle(sentiment)}</div>;
	};

	const items: MenuProps['items'] = [
		{
			key: 1,
			label: getSentimentLabel(sentiment as ESentiment) || null
		}
	];
	return (
		<div className={`${className} flex w-[100%] justify-between`}>
			<div className={`flex text-xs ${isRow ? 'flex-row' : 'flex-col'} md:flex-row md:items-center`}>
				<div className={'flex w-[66px] min-[320px]:w-auto min-[320px]:flex-row min-[320px]:items-center '}>
					<div className={'flex items-center '}>
						<NameLabel
							defaultAddress={defaultAddress}
							username={username}
							clickable={commentSource === 'polkassembly'}
							truncateUsername={truncateUsername}
							textClassName={'text-xs text-ellipsis overflow-hidden'}
						/>
						{text}&nbsp;
						{topic && (
							<div className='flex sm:-mt-0.5'>
								<span className='mr-2 mt-0.5 text-lightBlue'>in</span>{' '}
								<TopicTag
									topic={topic}
									className={topic}
								/>
							</div>
						)}
						{cid ? (
							<>
								<Divider
									type='vertical'
									style={{ borderLeft: '1px solid #485F7D' }}
								/>
								<Link
									href={`https://ipfs.io/ipfs/${cid}`}
									target='_blank'
								>
									{' '}
									<PaperClipOutlined /> IPFS
								</Link>
							</>
						) : null}
					</div>
				</div>
				<div className='flex items-center text-lightBlue max-xs:ml-1'>
					{(topic || text || created_at) && (
						<>
							&nbsp;
							<Divider
								className={`ml-1 md:inline-block ${!isRow ? 'hidden' : 'inline-block'}`}
								type='vertical'
								style={{ borderLeft: '1px solid #485F7D' }}
							/>
						</>
					)}
					{created_at && (
						<span className='-ml-[6px] -mt-[1px] flex items-center md:mt-0 md:pl-0'>
							<ClockCircleOutlined className='mx-1' />
							{relativeCreatedAt}
						</span>
					)}
					{children}
					{/* showing vote from local state */}
					{vote && (
						<div className='flex items-center justify-center'>
							<Divider
								className='mb-[-1px] ml-1 hidden md:inline-block'
								type='vertical'
								style={{ borderLeft: '1px solid #485F7D' }}
							/>
							{vote === EVoteDecisionType.AYE ? (
								<p className='mb-[-1px]'>
									<LikeFilled className='text-[green]' /> <span className='font-medium capitalize text-[green]'>Voted {vote}</span>
								</p>
							) : vote === EVoteDecisionType.NAY ? (
								<div>
									<DislikeFilled className='text-[red]' /> <span className='mb-[5px] font-medium capitalize text-[red]'>Voted {vote}</span>
								</div>
							) : vote === EVoteDecisionType.SPLIT ? (
								<div className='align-center mb-[-1px] flex justify-center'>
									<SplitYellow className='mr-1' /> <span className='font-medium capitalize text-[#FECA7E]'>Voted {vote}</span>
								</div>
							) : vote === EVoteDecisionType.ABSTAIN ? (
								<div className='align-center mb-[1px] flex justify-center'>
									<AbstainGray className='mr-1' /> <span className='font-medium capitalize text-bodyBlue'>Voted {vote}</span>
								</div>
							) : null}
						</div>
					)}

					{/* showing vote from subsquid */}
					{votesArr.length > 0 ? (
						<div
							className={votesArr.length > 1 ? 'ml-1 flex items-center justify-center hover:cursor-pointer' : 'ml-1 flex items-center justify-center'}
							onClick={() => {
								if (votesArr.length > 1) setShowVotesModal(!showVotesModal);
							}}
						>
							<Divider
								className='mb-[-1px] ml-1 hidden md:inline-block'
								type='vertical'
								style={{ borderLeft: '1px solid #485F7D' }}
							/>
							{votesArr[0].decision == 'yes' ? (
								<p className='mb-[-1px]'>
									<LikeFilled className='text-[green]' /> <span className='font-medium capitalize text-[green]'>Voted Aye</span>
								</p>
							) : votesArr[0].decision == 'no' ? (
								<div>
									<DislikeFilled className='text-[red]' /> <span className='mb-[5px] font-medium capitalize text-[red]'>Voted Nay</span>
								</div>
							) : votesArr[0].decision == 'abstain' && !(votesArr[0].balance as any).abstain ? (
								<div className='align-center mb-[-1px] flex justify-center'>
									<SplitYellow className='mr-1' /> <span className='font-medium capitalize text-[#FECA7E]'>Voted Split</span>
								</div>
							) : votesArr[0].decision == 'abstain' && (votesArr[0].balance as any).abstain ? (
								<div className='align-center mb-[1px] flex justify-center'>
									<AbstainGray className='mb-[-1px] mr-1' /> <span className='font-medium capitalize text-bodyBlue'>Voted Abstain</span>
								</div>
							) : null}
							{/* { votesArr.length > 1 && <p title={`${votesArr.length-1}+ votes available`}  className='mb-[-1px] ml-1' >{votesArr.length-1}+</p>} */}
							<Modal
								open={true}
								onCancel={() => setShowVotesModal(false)}
								footer={false}
								className={`w-[560px] ${poppins.variable} ${poppins.className} modal-container max-h-[675px] rounded-[6px] max-md:w-full`}
								closeIcon={<CloseCross />}
								wrapClassName={className}
								title={
									<div className='-mt-5 ml-[-24px] mr-[-24px] flex h-[65px] items-center gap-2 rounded-t-[6px] border-0 border-b-[1.5px]  border-solid border-[#D2D8E0]'>
										<span className='ml-4 text-xl font-semibold tracking-[0.0015em] text-bodyBlue'>Votes</span>
									</div>
								}
							>
								<div className='modal-container relative flex text-sm font-semibold text-bodyBlue'>
									<p className='m-0 p-0'>Vote</p>
									<p className='amount-container relative left-[122px] m-0 p-0'>Amount</p>
									<p className='conviction-container relative left-[186px] m-0 p-0'>Conviction</p>
									<p className='m-0 ml-auto p-0'>Voting Power</p>
								</div>
								<div className='my-2 border-0 border-b-[1px]  border-solid border-[#D2D8E0]'></div>
								{votesArr.length > 0 &&
									votesArr.slice(0, 1).map((vote: any, idx: any) => {
										const lockPeriod = vote.lockPeriod === 0 ? '0.1' : vote.lockPeriod;
										const conviction = vote?.decision === 'abstain' ? '0.1' : lockPeriod;
										const balance = parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network);
										// balance can be undefined
										console.log(votesArr.length);
										const balanceMatch = balance ? balance.match(/[\d.]+/) : null;
										const power = conviction * (balanceMatch ? parseFloat(balanceMatch[0]) : 0);
										return (
											<div
												key={idx}
												className='mb-2 flex items-center'
											>
												{vote.decision == 'yes' ? (
													<div className='mb-[-1px] justify-between '>
														<div className='flex'>
															<LikeFilled className='relative -top-[4px] text-[green]' /> <span className='relative -top-[2px] font-medium capitalize text-[green]'>Aye</span>
															{network !== AllNetworks.COLLECTIVES ? (
																<>
																	<div className={'amount-value relative left-[97px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																		{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																	</div>
																	{vote?.decision !== 'abstain' && (
																		<div className={'conviction-value relative left-[136px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>{`${
																			vote.lockPeriod === 0 ? '0.1' : vote.lockPeriod
																		}x`}</div>
																	)}
																</>
															) : (
																<div className={'relative left-[220px] overflow-ellipsis text-bodyBlue'}>
																	{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																</div>
															)}
															<div className='power-value relative left-[195px] w-[92px] overflow-ellipsis text-center text-bodyBlue'>{power}</div>
														</div>
													</div>
												) : vote.decision == 'no' ? (
													<div className='w-[90%] justify-between'>
														<div className='mb-[-1px] flex'>
															<DislikeFilled className='relative -top-[4px] text-[red]' />{' '}
															<span className='relative -top-[2px] mb-[5px] font-medium capitalize text-[red]'>Nay</span>
															{network !== AllNetworks.COLLECTIVES ? (
																<>
																	<div className={'amount-value relative left-[97px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																		{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																	</div>
																	{vote?.decision !== 'abstain' && (
																		<div className={'conviction-value relative left-[136px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>{`${
																			vote.lockPeriod === 0 ? '0.1' : vote.lockPeriod
																		}x`}</div>
																	)}
																</>
															) : (
																<div className={'relative left-[220px] overflow-ellipsis text-bodyBlue'}>
																	{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																</div>
															)}
															<div className='power-value relative left-[195px] w-[92px] overflow-ellipsis text-center text-bodyBlue'>{power}</div>
														</div>
													</div>
												) : vote.decision == 'abstain' && !(vote.balance as any).abstain ? (
													<div className='mb-[-1px] flex w-[90%] justify-between '>
														<div className='mb-[-1px]  flex'>
															<SplitYellow className='mr-1' /> <span className='font-medium capitalize text-[#FECA7E]'>Split</span>
															{network !== AllNetworks.COLLECTIVES ? (
																<>
																	<div className={'amount-value relative left-[97px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																		{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																	</div>
																	<div className={'conviction-value relative left-[136px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>-</div>
																</>
															) : (
																<div className={'amount-value relative left-[97px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																	{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																</div>
															)}
															<div className='power-value relative left-[195px] w-[92px] overflow-ellipsis text-center text-bodyBlue'>{power}</div>
														</div>
													</div>
												) : vote.decision == 'abstain' && (vote.balance as any).abstain ? (
													<div className=' align-center mb-[1px] flex w-[90%] justify-between'>
														<div className='flex justify-center align-middle'>
															<AbstainGray className='mr-1' /> <span className='font-medium capitalize text-bodyBlue'>Abstain</span>
															{network !== AllNetworks.COLLECTIVES ? (
																<>
																	<div className={'abstain-amount-value relative left-[62px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																		{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																	</div>
																	<div className={'abstain-conviction-value relative left-[102px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>-</div>
																</>
															) : (
																<div className={'abstain-amount-value relative left-[103px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																	{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																</div>
															)}
															<div className='abstain-power-value relative left-[159px] w-[92px] overflow-ellipsis text-center text-bodyBlue'>{power}</div>
														</div>
													</div>
												) : null}
											</div>
										);
									})}
								<div>
									<div className='mb-2 mt-1 border-0 border-b-[1px] border-dashed border-[#D2D8E0]'></div>
									<p className='m-0 mb-2 p-0 text-sm font-semibold text-bodyBlue'>Vote History</p>
									{votesArr.length > 0 &&
										votesArr.slice(1, 3).map((vote: any, idx: any) => {
											const lockPeriod = vote.lockPeriod === 0 ? '0.1' : vote.lockPeriod;
											const conviction = vote?.decision === 'abstain' ? '0.1' : lockPeriod;
											const balance = parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network);
											// balance can be undefined
											const balanceMatch = balance ? balance.match(/[\d.]+/) : null;
											const power = conviction * (balanceMatch ? parseFloat(balanceMatch[0]) : 0);
											return (
												<div
													key={idx}
													className='mb-2 flex items-center'
												>
													{vote.decision == 'yes' ? (
														<div className='mb-[-1px] justify-between '>
															<div className='flex'>
																<LikeFilled className='relative -top-[4px] text-[green]' /> <span className='relative -top-[2px] font-medium capitalize text-[green]'>Aye</span>
																{network !== AllNetworks.COLLECTIVES ? (
																	<>
																		<div className={'amount-value relative left-[97px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																			{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																		</div>
																		{vote?.decision !== 'abstain' && (
																			<div className={'conviction-value relative left-[136px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>{`${
																				vote.lockPeriod === 0 ? '0.1' : vote.lockPeriod
																			}x`}</div>
																		)}
																	</>
																) : (
																	<div className={'relative left-[220px] overflow-ellipsis text-bodyBlue'}>
																		{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																	</div>
																)}
																<div className='power-value relative left-[195px] w-[92px] overflow-ellipsis text-center text-bodyBlue'>{power}</div>
															</div>
														</div>
													) : vote.decision == 'no' ? (
														<div className='w-[90%] justify-between'>
															<div className='mb-[-1px] flex'>
																<DislikeFilled className='relative -top-[4px] text-[red]' />{' '}
																<span className='relative -top-[2px] mb-[5px] font-medium capitalize text-[red]'>Nay</span>
																{network !== AllNetworks.COLLECTIVES ? (
																	<>
																		<div className={'amount-value relative left-[97px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																			{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																		</div>
																		{vote?.decision !== 'abstain' && (
																			<div className={'conviction-value relative left-[136px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>{`${
																				vote.lockPeriod === 0 ? '0.1' : vote.lockPeriod
																			}x`}</div>
																		)}
																	</>
																) : (
																	<div className={'relative left-[220px] overflow-ellipsis text-bodyBlue'}>
																		{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																	</div>
																)}
																<div className='power-value relative left-[195px] w-[92px] overflow-ellipsis text-center text-bodyBlue'>{power}</div>
															</div>
														</div>
													) : vote.decision == 'abstain' && !(vote.balance as any).abstain ? (
														<div className='mb-[-1px] flex w-[90%] justify-between '>
															<div className='mb-[-1px]  flex'>
																<SplitYellow className='mr-1' /> <span className='font-medium capitalize text-[#FECA7E]'>Split</span>
																{network !== AllNetworks.COLLECTIVES ? (
																	<>
																		<div className={'amount-value relative left-[97px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																			{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																		</div>
																		<div className={'conviction-value relative left-[136px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>-</div>
																	</>
																) : (
																	<div className={'amount-value relative left-[97px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																		{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																	</div>
																)}
																<div className='power-value relative left-[195px] w-[92px] overflow-ellipsis text-center text-bodyBlue'>{power}</div>
															</div>
														</div>
													) : vote.decision == 'abstain' && (vote.balance as any).abstain ? (
														<div className=' align-center mb-[1px] flex w-[90%] justify-between'>
															<div className='flex justify-center align-middle'>
																<AbstainGray className='mr-1' /> <span className='font-medium capitalize text-bodyBlue'>Abstain</span>
																{network !== AllNetworks.COLLECTIVES ? (
																	<>
																		<div className={'abstain-amount-value relative left-[62px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																			{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																		</div>
																		<div className={'abstain-conviction-value relative left-[102px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>-</div>
																	</>
																) : (
																	<div className={'abstain-amount-value relative left-[103px] w-[92px] overflow-ellipsis text-center text-bodyBlue'}>
																		{parseBalance((vote?.decision === 'abstain' ? vote?.balance?.abstain || 0 : vote?.balance?.value || 0).toString(), 2, true, network)}
																	</div>
																)}
																<div className='abstain-power-value relative left-[159px] w-[92px] overflow-ellipsis text-center text-bodyBlue'>{power}</div>
															</div>
														</div>
													) : null}
												</div>
											);
										})}
								</div>
							</Modal>
						</div>
					) : null}
				</div>
			</div>

			<div className='flex'>
				{spam_users_count && typeof spam_users_count === 'number' && spam_users_count > 0 ? (
					<div className='mr-2 flex items-center'>
						<Tooltip
							color='#E5007A'
							title={`This comment has been reported as spam by ${spam_users_count} members`}
						>
							<WarningMessageIcon className='scale-75 text-xl text-[#FFA012]' />
						</Tooltip>
					</div>
				) : null}

				<Dropdown
					overlayClassName='sentiment-hover'
					placement='topCenter'
					menu={{ items }}
					className='flex items-center  justify-center text-lg text-white  min-[320px]:mr-2'
				>
					<div>{getSentimentIcon(sentiment as ESentiment)}</div>
				</Dropdown>
				{commentSource === 'subsquare' && (
					<Styled>
						<HelperTooltip
							text={
								<span>
									This comment is imported from <span className='dark-pink'>Subsqaure</span>
								</span>
							}
							placement={'leftTop'}
							bgColor='#FCE5F2'
						/>
					</Styled>
				)}
			</div>
		</div>
	);
};

export default styled(CreationLabel)`
	@media (min-width: 468px) and (max-width: 389px) {
		.amount-container {
			left: 58px !important;
		}

		.conviction-container {
			left: 68px !important;
		}

		.amount-value {
			left: 55px !important;
		}

		.conviction-value {
			left: 100px !important;
		}

		.power-value {
			left: 178px !important;
		}
	}
`;
