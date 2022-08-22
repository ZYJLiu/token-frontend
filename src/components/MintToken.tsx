import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Transaction, PublicKey } from "@solana/web3.js"
import {
  createMintToInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  Account,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  getMint,
} from "@solana/spl-token"
import { FC, useCallback, useState } from "react"
import { notify } from "../utils/notifications"

export const MintToken: FC = () => {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const [tokenMint, setTokenMint] = useState("")
  const [recipientPublicKey, setRecipientPublicKey] = useState("")
  const [amount, setAmount] = useState("")

  const onClick = useCallback(
    async (form) => {
      if (!publicKey) {
        notify({ type: "error", message: `Wallet not connected!` })
        console.log("error", `Send Transaction: Wallet not connected!`)
        return
      }

      // get token mint data to account for decimals when minting
      const mintData = await getMint(connection, form.tokenMint)

      // get token address of receipient
      const tokenAddress = await getAssociatedTokenAddress(
        form.tokenMint, // token mint
        form.recipientPublicKey // owner public key
      )

      // create instrction instruction to create ATA
      const createAccountInstruction = createAssociatedTokenAccountInstruction(
        publicKey, // payer
        tokenAddress, // token address
        form.recipientPublicKey, // token owner
        form.tokenMint // token mint
      )

      // create new transaction
      const transaction = new Transaction()

      let tokenAccount: Account
      try {
        // check if token account already exists
        tokenAccount = await getAccount(
          connection, // connection
          tokenAddress // token address
        )
      } catch (error: unknown) {
        if (
          error instanceof TokenAccountNotFoundError ||
          error instanceof TokenInvalidAccountOwnerError
        ) {
          try {
            // add instruction to create token account if one does not exist
            transaction.add(createAccountInstruction)
          } catch (error: unknown) {}
        } else {
          throw error
        }
      }

      // add instruction to mint tokens
      transaction.add(
        createMintToInstruction(
          form.tokenMint, // token mint
          tokenAddress, // token account address
          publicKey, // mint authority
          form.amount * 10 ** mintData.decimals // amount to mint
        )
      )

      // send transaction
      sendTransaction(transaction, connection).then((transactionSignature) => {
        // notification with tx sig
        notify({
          type: "success",
          message: `Tokens Minted`,
          txid: transactionSignature,
        })
      })
    },
    [publicKey, connection]
  )

  return (
    <div>
      <div className="my-6">
        <input
          type="text"
          className="form-control block mb-2 w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          placeholder="Token Mint Address"
          onChange={(e) => setTokenMint(e.target.value)}
        />
        <input
          type="text"
          className="form-control block mb-2 w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          placeholder="Recipient PublicKey"
          onChange={(e) => setRecipientPublicKey(e.target.value)}
        />
        <input
          type="number"
          className="form-control block mb-2 w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          placeholder="Amount"
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="group w-60 m-2 btn animate-pulse disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... "
          onClick={() =>
            onClick({
              tokenMint: new PublicKey(tokenMint),
              recipientPublicKey: new PublicKey(recipientPublicKey),
              amount: Number(amount),
            })
          }
          disabled={!publicKey}
        >
          <div className="hidden group-disabled:block ">
            Wallet not connected
          </div>
          <span className="block group-disabled:hidden">Mint Tokens</span>
        </button>
      </div>
    </div>
  )
}
