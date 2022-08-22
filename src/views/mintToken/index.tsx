import { FC } from "react"
import { MintToken } from "../../components/MintToken"

export const MintTokenView: FC = ({}) => {
  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
          Mint Token
        </h1>
        {/* CONTENT GOES HERE */}
        <div className="text-center">
          <MintToken />
        </div>
      </div>
    </div>
  )
}
