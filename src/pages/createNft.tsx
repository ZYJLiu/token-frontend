import type { NextPage } from "next"
import Head from "next/head"
import { CreateNftView } from "../views"

const CreateNft: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta name="description" content="Basic Functionality" />
      </Head>
      <CreateNftView />
    </div>
  )
}

export default CreateNft
