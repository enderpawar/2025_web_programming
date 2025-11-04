import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

const ProblemCard = ({ problem, onClick, canDelete, onDelete }) => (
  <div className="w-full bg-white/5 hover:bg-white/10 transition rounded-xl border border-white/10 p-4 flex items-center gap-4">
    <button onClick={onClick} className="flex-1 text-left flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-white/10 grid place-items-center text-white/80 font-bold">
        {problem.difficulty?.[0]?.toUpperCase() || 'P'}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="text-lg font-semibold text-white/90 truncate">{problem.title}</div>
        <div className="text-xs text-white/60 truncate">{problem.difficulty} • {problem.functionName || 'solve'}</div>
      </div>
    </button>
    {canDelete && problem.id !== 'legacy' && (
      <button title="Delete" onClick={onDelete} className="px-2 py-1 rounded bg-red-500/80 hover:bg-red-500 text-white text-xs">Delete</button>
    )}
  </div>
);

const CreateProblemModal = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState('Two Sum');
  const [difficulty, setDifficulty] = useState('Easy');
  const [functionName, setFunctionName] = useState('solve');
  const [description, setDescription] = useState('Given an array of numbers and a target, return indices of the two numbers that add up to target.');
  const [starterCode, setStarterCode] = useState('function solve(nums, target) {\n  // TODO\n}');
  const [samples, setSamples] = useState('[{"input":[[2,7,11,15],9],"output":[0,1]}]');
  const [tests, setTests] = useState('[{"input":[[2,7,11,15],9],"output":[0,1]}]');
  const [err, setErr] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0f2135] rounded-xl border border-white/10 p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Create Problem</h3>
        <div className="space-y-3">
          <input className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10" placeholder="Difficulty" value={difficulty} onChange={(e)=>setDifficulty(e.target.value)} />
            <input className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10" placeholder="Function Name" value={functionName} onChange={(e)=>setFunctionName(e.target.value)} />
          </div>
          <textarea className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 min-h-24" placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />
          <textarea className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 font-mono text-sm min-h-28" placeholder="Starter Code" value={starterCode} onChange={(e)=>setStarterCode(e.target.value)} />
          <textarea className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 font-mono text-xs min-h-24" placeholder='Samples JSON' value={samples} onChange={(e)=>setSamples(e.target.value)} />
          <textarea className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 font-mono text-xs min-h-24" placeholder='Tests JSON' value={tests} onChange={(e)=>setTests(e.target.value)} />
          {err && <div className="text-red-400 text-sm">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded-md bg-teal-500 hover:bg-teal-400 text-black font-semibold" onClick={()=>{
            try{
              const s = samples ? JSON.parse(samples) : [];
              const t = tests ? JSON.parse(tests) : [];
              onCreate({ title, difficulty, functionName, description, language:'javascript', starterCode, samples:s, tests:t });
            }catch(e){ setErr('Invalid JSON in samples/tests'); }
          }}>Create</button>
        </div>
      </div>
    </div>
  );
};

const RoomProblems = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [problems, setProblems] = useState([]);
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try{
        const who = await api.me();
        setMe(who);
        const r = await api.room(roomId);
        setRoom(r);
        const list = await api.problems(roomId);
        setProblems(list);
      }catch(e){ console.error(e); }
    })();
  }, [roomId]);

  return (
    <div className="min-h-screen bg-[#0f2135] text-white">
      <header className="border-b border-white/10 bg-[#0e1c2d]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={()=>navigate('/rooms')} className="text-teal-300 font-extrabold tracking-widest text-xl">JSC</button>
          <div className="flex items-center gap-2">
            <button onClick={()=>navigate('/rooms')} className="px-3 py-1.5 rounded-md text-sm bg-white/10 hover:bg-white/20">Back</button>
            {room && me && me.id === room.ownerId && (
              <button className="px-3 py-1.5 rounded-md text-sm bg-teal-500 hover:bg-teal-400 text-black font-semibold" onClick={()=>setOpen(true)}>CREATE PROBLEM</button>
            )}
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-2xl font-semibold mb-4">{room?.name || 'Room'}</div>
        <div className="grid gap-4">
          {problems.map((p) => (
            <ProblemCard
              key={p.id}
              problem={p}
              onClick={()=>navigate(`/rooms/${roomId}/problems/${p.id}`)}
              canDelete={me && room && me.id === room.ownerId}
              onDelete={async (e)=>{
                e.stopPropagation();
                const ok = confirm(`Delete problem "${p.title}"? This cannot be undone.`);
                if (!ok) return;
                try{
                  await api.deleteProblem(roomId, p.id);
                  setProblems((prev)=>prev.filter((x)=>x.id!==p.id));
                }catch(err){ alert(err.message); }
              }}
            />
          ))}
          {problems.length===0 && (
            <div className="text-white/60 text-center py-16">No problems yet. Create one.</div>
          )}
        </div>
      </div>
      <CreateProblemModal open={open} onClose={()=>setOpen(false)} onCreate={async (payload)=>{
        try{
          const created = await api.createProblem(roomId, payload);
          setProblems((prev)=>[created, ...prev]);
          setOpen(false);
        }catch(e){ alert(e.message); }
      }} />
    </div>
  );
};

export default RoomProblems;
