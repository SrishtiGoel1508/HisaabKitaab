import React, { useState } from 'react';
import { api } from '../services/api.js';
import { NaturalLanguageQueryResultDTO } from '../../shared/types/receipt.js';
import { formatINR } from '../utils/formatters.js';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  Receipt as ReceiptIcon,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Loader2,
} from 'lucide-react';

interface Props {
  onOpenReceipt: (id: string) => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  queryResult?: NaturalLanguageQueryResultDTO;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  'How much did I spend this month?',
  'Which category accounts for the most spending?',
  'How much did I spend on dairy products?',
  'Which vendors did I purchase from most frequently?',
  'Show my largest confirmed purchases.',
  'How much did I spend on packaged snacks & biscuits?',
];

export const AskAIPage: React.FC<Props> = ({ onOpenReceipt }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Namaste! I am your Hisaab Kitaab AI Bookkeeping Assistant. Ask me anything about your confirmed store purchases, monthly expenses, dairy bills, or top suppliers.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const result = await api.askQuery(q);

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: result.answer,
        queryResult: result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Sorry, I encountered an issue querying your records: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2f4eb] text-xs font-bold text-[#1b4d3e] mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#256d53]" />
          Backend Verified Evidence • No AI Arithmetic Hallucinations
        </div>
        <h1 className="text-2xl font-extrabold text-[#14372c]">
          Ask Hisaab Kitaab
        </h1>
        <p className="text-xs sm:text-sm text-[#66776e] mt-1">
          Ask questions about your confirmed bills in natural language. Numerical answers are calculated directly from your database, and explained by Gemini.
        </p>
      </div>

      {/* Suggested Questions Quick Bar */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-[#6a7a70] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#3ba97f]" /> Try asking:
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(sug)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white hover:bg-[#eaf5ef] text-[#243c30] border border-[#dcd7cb] hover:border-[#256d53] transition-all shadow-sm"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-2xl border border-[#e5e1d6] shadow-sm p-4 sm:p-6 min-h-[420px] max-h-[600px] overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-[#256d53] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <BotMessageSquare className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-[#1b4d3e] text-white rounded-tr-none'
                  : 'bg-[#f7f5ed] text-[#1e342a] border border-[#e8e4d8] rounded-tl-none'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Verified Authoritative Evidence Highlight Box */}
              {msg.queryResult && msg.queryResult.data && (
                <div className="pt-3 border-t border-[#ded9cb] space-y-2.5">
                  <div className="p-3 bg-white rounded-xl border border-[#dedad0] shadow-sm">
                    <div className="flex items-center justify-between text-xs text-[#718177] pb-1 border-b border-[#f0ece1]">
                      <span className="font-bold uppercase tracking-wider text-[#256d53] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified Authoritative Figure
                      </span>
                      <span>{msg.queryResult.data.receiptCount} confirmed receipt(s)</span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-[#14372c]">
                        {msg.queryResult.data.amountFormatted || '₹0.00'}
                      </span>
                      {msg.queryResult.data.category && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#eaf5ef] text-[#1b4d3e]">
                          {msg.queryResult.data.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Supporting Receipts Links */}
                  {msg.queryResult.data.receiptIds && msg.queryResult.data.receiptIds.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-[#55665d] mb-1.5 uppercase tracking-wide">
                        Contributing Receipt Evidence ({msg.queryResult.data.receiptIds.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.queryResult.data.receiptIds.map((recId) => (
                          <button
                            key={recId}
                            onClick={() => onOpenReceipt(recId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#e4efe8] text-[#1f3d31] font-semibold text-xs border border-[#cfc9bc] transition-colors"
                          >
                            <ReceiptIcon className="w-3 h-3 text-[#256d53]" />
                            Receipt #{recId.slice(-6)}
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-[10px] text-right opacity-60">
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-[#c5eed9] text-[#1b4d3e] font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                You
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#256d53] text-white flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-[#f7f5ed] rounded-2xl rounded-tl-none border border-[#e8e4d8] text-xs text-[#55665d] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#3ba97f] animate-spin" />
              Executing deterministic database queries &amp; synthesizing explanation...
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-[#dedad0] shadow-sm"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your store's spending (e.g. How much did I spend on dairy this month?)..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-transparent focus:outline-none text-[#1b3d30]"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="p-3 rounded-xl bg-[#256d53] hover:bg-[#1d5742] text-white disabled:opacity-40 transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
