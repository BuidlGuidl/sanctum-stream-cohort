import React, { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { readContract } from "@wagmi/core";
import { BigNumber } from "ethers";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Contributions } from "~~/components/Contributions";
import { HackerStreams } from "~~/components/HackerStreams";
import { StreamContract } from "~~/components/StreamContract";
import { useScaffoldContractRead, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

type BuilderData = {
  cap: BigNumber;
  unlockedAmount: BigNumber;
  builderAddress: string;
};

const Home: NextPage = () => {
  const { address } = useAccount();

  const [builderList, setBuilderList] = useState<string[]>([]);

  const { data: allBuildersData, isLoading: isLoadingBuilderData } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "allBuildersData",
    args: [builderList],
  });

  const { data: streamData } = useDeployedContractInfo("YourContract");

  const { data: withdrawEvents, isLoading: isLoadingWithdrawEvents } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "Withdraw",
    fromBlock: Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) || 0,
    blockData: true,
  });

  const { data: addBuilderEvents, isLoading: isLoadingBuilderEvents } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "AddBuilder",
    fromBlock: Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) || 0,
  });

  useEffect(() => {
    if (addBuilderEvents && addBuilderEvents.length > 0) {
      const fetchedBuilderList = addBuilderEvents.map((event: any) => event.args.to);
      const uniqueBuilderList = [...new Set(fetchedBuilderList)];
      filterBuilders(uniqueBuilderList)
        .then(filteredBuilders => {
          setBuilderList(filteredBuilders as string[]);
        })
        .catch(error => {
          console.error(error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addBuilderEvents]);

  const amIAStreamedBuilder = allBuildersData?.some(
    (builderData: BuilderData) => builderData.builderAddress === address,
  );

  const title = "⚗️ Sanctum Cohort Stream";

  const desc = "A quiet place for special BuidlGuidl builders to create and collaborate.";

  const titleImage = "sanctum2.png";

  const isZeroCap = async (address: string) => {
    if (streamData) {
      const data = await readContract({
        address: streamData?.address as string,
        abi: streamData?.abi,
        functionName: "streamedBuilders",
        args: [address],
      });

      const { cap } = data;
      if (cap !== undefined && Number(cap) > 0) {
        return true;
      } else {
        return false;
      }
    }
  };

  const filterBuilders = async (builderList: string[]) => {
    const filteredBuilders = await Promise.all(
      builderList.map(async address => {
        if (await isZeroCap(address)) {
          return address;
        }
      }),
    );
    return filteredBuilders.filter(Boolean);
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_VERCEL_URL || ""} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex items-center flex-col flex-grow pt-10 mb-20 mx-auto font-grotesk gap-5">
        <div className="max-w-[42rem] m-auto w-[90%] bg-secondary px-8 py-4 rounded-2xl">
          <p className="font-bold text-left text-4xl leading-6 py-2">{title}</p>
          <Image src={"/" + titleImage} alt="Title Image" width={500} height={500} className="mx-4" />
          <p>{desc + " "} </p>
          <p>
            Chosen developers can submit their contributions, automatically claim grant streams, and showcase their work
            onchain.
          </p>
        </div>

        <div className="max-w-[42rem] m-auto w-[90%] bg-secondary rounded-2xl">
          <h2 className="font-bold text-2xl px-8 py-4 border-b-2">⏳ ETH Streams</h2>
          <div>
            <HackerStreams
              allBuildersData={allBuildersData}
              withdrawEvents={withdrawEvents}
              isLoadingBuilderData={isLoadingBuilderData}
              isLoadingBuilderEvents={isLoadingBuilderEvents}
            />
          </div>
          <h2 className="font-bold text-2xl px-8 py-4 border-b-2 bg-accent opacity-60">📑 Contract Details</h2>
          <div className="p-0 bg-accent rounded-b-2xl opacity-60">
            <StreamContract amIAStreamedBuilder={amIAStreamedBuilder} />
          </div>
        </div>

        <div className="max-w-[42rem] m-auto w-[90%] bg-secondary rounded-2xl">
          <h2 className="font-bold text-2xl px-8 py-4 border-b-2">Contributions</h2>
          <div className="p-0">
            <Contributions withdrawEvents={withdrawEvents} isLoadingWithdrawEvents={isLoadingWithdrawEvents} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
