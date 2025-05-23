import { Loader2 } from "lucide-react"

const AnalysisLoader = () => {
  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800  bg-opacity-80 p-8 rounded-lg shadow-lg flex items-center">
        <Loader2 className="animate-spin  h-12 w-12 text-purple-500 mb-4" />
        <p className="text-lg text-purple-300 text-center">Analyzing...</p>
      </div>
    </div>
  )
}

export default AnalysisLoader;

