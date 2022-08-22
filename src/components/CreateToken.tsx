import { FC, useState, useEffect } from "react"
import { Transaction, Keypair, SystemProgram } from "@solana/web3.js"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
} from "@solana/spl-token"
import {
  DataV2,
  createCreateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata"
import {
  Metaplex,
  walletAdapterIdentity,
  bundlrStorage,
  MetaplexFile,
  toMetaplexFileFromBrowser,
  findMetadataPda,
} from "@metaplex-foundation/js"

import { notify } from "../utils/notifications"

export const CreateToken: FC = () => {
  const wallet = useWallet()
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [imageUrl, setImageUrl] = useState(null)
  const [metadataUrl, setMetadataUrl] = useState(null)

  const [tokenName, setTokenName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [description, setDescription] = useState("")
  const [decimals, setDecimals] = useState("")

  const [mint, setMint] = useState("")

  // set up metaplex object
  const metaplex = new Metaplex(connection).use(
    bundlrStorage({
      address: "https://devnet.bundlr.network",
      providerUrl: "https://api.devnet.solana.com",
      timeout: 60000,
    })
  )

  if (wallet.connected) {
    metaplex.use(walletAdapterIdentity(wallet))
  }

  // upload image
  const uploadImage = async (event) => {
    const file: MetaplexFile = await toMetaplexFileFromBrowser(
      event.target.files[0]
    )

    const imageUrl = await metaplex.storage().upload(file)
    setImageUrl(imageUrl)
  }

  // upload metadata
  const uploadMetadata = async () => {
    const data = {
      name: tokenName,
      symbol: symbol,
      description: description,
      image: imageUrl,
    }
    const { uri } = await metaplex.nfts().uploadMetadata(data).run()
    setMetadataUrl(uri)
    console.log(uri)
  }

  // create mint and metadata account
  const createToken = async (data) => {
    if (!metadataUrl) {
      return
    }

    // keypair for new mint
    const mint = Keypair.generate()

    // rent for new mint
    const lamports = await getMinimumBalanceForRentExemptMint(connection)

    // get metadata account address
    const metadataPDA = await findMetadataPda(mint.publicKey)

    // onchain metadata format
    const tokenMetadata = {
      name: tokenName,
      symbol: symbol,
      uri: metadataUrl,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    } as DataV2

    // create new transaction
    const transaction = new Transaction()

    // add instructions
    transaction.add(
      // create new account
      SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),

      // create new mint
      createInitializeMintInstruction(
        mint.publicKey, // mint address
        Number(decimals), // decimals
        publicKey, // mint authority
        publicKey, // freeze authority
        TOKEN_PROGRAM_ID // token program
      ),

      // create new metadata account
      createCreateMetadataAccountV2Instruction(
        {
          metadata: metadataPDA,
          mint: mint.publicKey,
          mintAuthority: publicKey,
          payer: publicKey,
          updateAuthority: publicKey,
        },
        {
          createMetadataAccountArgsV2: {
            data: tokenMetadata,
            isMutable: true,
          },
        }
      )
    )

    // send transaction
    sendTransaction(transaction, connection, {
      signers: [mint],
    }).then((transactionSignature) => {
      // notification with tx sig
      notify({
        type: "success",
        message: `Token Created`,
        txid: transactionSignature,
      })
      // set token mint to display
      setMint(mint.publicKey.toString())
    })
  }

  // send transaction once metadata uplaoded
  useEffect(() => {
    if (metadataUrl != null) {
      createToken({
        metadata: metadataUrl,
        tokenName: tokenName,
        symbol: symbol,
        description: description,
        decimals: decimals,
      })
    }
  }, [metadataUrl])

  // solana explorer url to token mint
  const link = () => {
    return mint
      ? `https://explorer.solana.com/address/${mint}?cluster=devnet`
      : ""
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-1 sm:gap-4 sm:px-6">
        {!mint ? (
          <div className="mt-1 sm:mt-0 sm:col-span-1">
            <div className="max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <label
                  htmlFor="image-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-purple-500 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  {!imageUrl ? (
                    <div>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Upload Token Image
                      <input
                        id="image-upload"
                        name="image-upload"
                        type="file"
                        className="sr-only"
                        onChange={uploadImage}
                        disabled={!wallet.connected}
                      />
                    </div>
                  ) : (
                    <div>
                      Image Uploaded
                      <img src={imageUrl} />
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div className="my-6">
              <input
                type="text"
                className="form-control block mb-2 w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Token Name"
                onChange={(e) => setTokenName(e.target.value)}
              />
              <input
                type="text"
                className="form-control block mb-2 w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Symbol"
                onChange={(e) => setSymbol(e.target.value)}
              />
              <input
                type="text"
                className="form-control block mb-2 w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Description"
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                type="number"
                className="form-control block mb-2 w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Decimals"
                onChange={(e) => setDecimals(e.target.value)}
              />
              <button
                className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
                onClick={async () => uploadMetadata()}
                disabled={!wallet.connected}
              >
                Create Token
              </button>
            </div>
          </div>
        ) : (
          <div className="px-1 py-1 bg-white space-y-1 sm:p-1">
            <h1 className="text-lg font-medium l text-gray-700 my-3">
              Mint Address: {mint}
            </h1>
            <a
              className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
              href={link()}
              target="_blank"
              rel="noreferrer"
            >
              View Token on Solana Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
