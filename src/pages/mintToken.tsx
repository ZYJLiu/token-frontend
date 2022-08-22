import type { NextPage } from "next"
import Head from "next/head"
import { MintTokenView } from "../views"

const MintToken: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta name="description" content="Basic Functionality" />
      </Head>
      <MintTokenView />
    </div>
  )
}

export default MintToken
