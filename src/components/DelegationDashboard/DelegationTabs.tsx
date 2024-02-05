// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Tabs } from '~src/ui-components/Tabs';
import BecomeDelegate from './BecomeDelegate';
import TotalDelegationData from './TotalDelegationData';
import TrendingDelegates from './TrendingDelegates';
import { Skeleton, TabsProps } from 'antd';
import DelegationProfile from '~src/ui-components/DelegationProfile';
import DashboardTrackListing from './TracksListing';
import nextApiClientFetch from '~src/util/nextApiClientFetch';
import { useNetworkSelector, useUserDetailsSelector } from '~src/redux/selectors';
import { IGetProfileWithAddressResponse } from 'pages/api/v1/auth/data/profileWithAddress';
import { IDelegationProfileType } from '~src/auth/types';
import { DeriveAccountRegistration, DeriveAccountInfo } from '@polkadot/api-derive/types';
import { useApiContext } from '~src/context';
import getEncodedAddress from '~src/util/getEncodedAddress';

interface Props {
	className?: string;
	theme?: string;
	isLoggedOut: boolean;
}

const DelegationTabs = ({ className, theme, isLoggedOut }: Props) => {
	const userProfile = useUserDetailsSelector();
	const { api, apiReady } = useApiContext();
	const { network } = useNetworkSelector();
	const { delegationDashboardAddress } = userProfile;
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [identity, setIdentity] = useState<DeriveAccountRegistration>();
	const [profileDetails, setProfileDetails] = useState<IDelegationProfileType>({
		bio: '',
		image: '',
		social_links: [],
		user_id: 0,
		username: ''
	});
	const [userBio, setUserBio] = useState<string>('');

	const getData = async () => {
		try {
			const { data, error } = await nextApiClientFetch<IGetProfileWithAddressResponse>(
				`api/v1/auth/data/profileWithAddress?address=${delegationDashboardAddress}`,
				undefined,
				'GET'
			);
			if (error || !data || !data.username || !data.user_id) {
				return;
			}
			setProfileDetails({
				bio: data.profile.bio || '',
				image: data.profile.image || '',
				social_links: data.profile.social_links || [],
				user_id: data.user_id,
				username: data.username
			});
		} catch (error) {
			console.log(error);
		}
	};

	const handleIdentityInfo = () => {
		if (!api || !apiReady) return;

		let unsubscribe: () => void;

		const encodedAddr = delegationDashboardAddress ? getEncodedAddress(delegationDashboardAddress, network) || '' : '';

		api.derive.accounts
			.info(encodedAddr, (info: DeriveAccountInfo) => {
				setIdentity(info.identity);
			})
			.then((unsub) => {
				unsubscribe = unsub;
			})
			.catch((e) => {
				console.error(e);
			});

		return () => unsubscribe && unsubscribe();
	};

	useEffect(() => {
		setProfileDetails({
			bio: '',
			image: '',
			social_links: [],
			user_id: 0,
			username: ''
		});
		getData();

		if (!api || !apiReady) return;
		handleIdentityInfo();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [delegationDashboardAddress, api, apiReady]);

	const tabItems: TabsProps['items'] = [
		{
			children: (
				<>
					{isLoggedOut && <h2 className='mb-6 mt-5 text-2xl font-semibold text-bodyBlue dark:text-blue-dark-high max-lg:pt-[60px] md:mb-5'>Delegation </h2>}
					<BecomeDelegate
						isModalOpen={isModalOpen}
						setIsModalOpen={setIsModalOpen}
						profileDetails={profileDetails}
						userBio={userBio}
						setUserBio={setUserBio}
						onchainUsername={identity?.display || identity?.legal || ''}
					/>
					<TotalDelegationData />
					<TrendingDelegates />
				</>
			),
			key: '1',
			label: <span className='px-1.5 '>Dashboard</span>
		},
		{
			children: (
				<>
					<BecomeDelegate
						isModalOpen={isModalOpen}
						setIsModalOpen={setIsModalOpen}
						profileDetails={profileDetails}
						userBio={userBio}
						setUserBio={setUserBio}
						onchainUsername={identity?.display || identity?.legal || ''}
					/>
					<DelegationProfile
						className='mt-8 rounded-xxl bg-white px-6 py-5 drop-shadow-md dark:bg-section-dark-overlay'
						profileDetails={profileDetails}
						setIsModalOpen={setIsModalOpen}
						userBio={userBio}
						setUserBio={setUserBio}
						identity={identity || null}
					/>
					<div className='mt-8 rounded-xxl bg-white p-5 drop-shadow-md dark:bg-section-dark-overlay'>
						{!!userProfile?.delegationDashboardAddress && userProfile?.delegationDashboardAddress?.length > 0 ? (
							<DashboardTrackListing
								theme={theme}
								address={String(userProfile.delegationDashboardAddress)}
							/>
						) : (
							<Skeleton />
						)}
					</div>
				</>
			),
			key: '2',
			label: <span className='px-1.5'>My Delegation</span>
		}
	];

	return (
		<div className={classNames(className, 'mt-8 rounded-[18px]')}>
			<Tabs
				defaultActiveKey='2'
				theme={theme}
				type='card'
				className='ant-tabs-tab-bg-white font-medium text-bodyBlue dark:bg-transparent dark:text-blue-dark-high'
				items={tabItems}
			/>
		</div>
	);
};

export default styled(DelegationTabs)`
	.ant-tabs-tab-active .active-icon {
		filter: brightness(0) saturate(100%) invert(13%) sepia(94%) saturate(7151%) hue-rotate(321deg) brightness(90%) contrast(101%);
	}
	//dark mode icon color change
	// .dark .darkmode-icons {
	// filter: brightness(100%) saturate(0%) contrast(4) invert(100%) !important;
	// }
`;
