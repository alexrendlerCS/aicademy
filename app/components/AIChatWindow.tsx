const Message = ({ message }: { message: ChatMessage }) => {
  return (
    <div
      className={`flex flex-col w-full p-4 ${
        message.role === "user"
          ? "bg-blue-50 dark:bg-blue-900/20"
          : "bg-gray-50 dark:bg-gray-900/20"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
            message.role === "user" ? "bg-blue-500" : "bg-purple-500"
          }`}
        >
          {message.role === "user" ? "U" : "AI"}
        </div>
        <span className="font-medium">
          {message.role === "user" ? "You" : "AI Assistant"}
        </span>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-orange-500 dark:text-orange-400 mt-4 mb-2">
                {children}
              </h2>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside my-2">{children}</ul>
            ),
            li: ({ children }) => <li className="my-1">{children}</li>,
            p: ({ children }) => (
              <p className="my-2 leading-relaxed">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-blue-600 dark:text-blue-400">
                {children}
              </strong>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};
