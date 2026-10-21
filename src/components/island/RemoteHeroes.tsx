// Герои других игроков на этом острове: позиция приходит по сети, движение сглажено переходом.
import { useEffect, useState } from 'react';
import { Hero } from './Hero';
import { onPositions, peerPositions, usePeers } from '../../multiplayer/room';
import type { PeerPos } from '../../multiplayer/transport';

export function RemoteHeroes({ islandId }: { islandId: string }) {
  const peers = usePeers();
  const [pos, setPos] = useState<ReadonlyMap<string, PeerPos>>(() => new Map(peerPositions()));
  useEffect(() => onPositions(() => setPos(new Map(peerPositions()))), []);
  return (
    <>
      {peers
        .filter((p) => p.view === 'island' && p.islandId === islandId)
        .map((p) => {
          const at = pos.get(p.id);
          if (!at || at.islandId !== islandId) return null;
          return (
            <div
              key={p.id}
              className="remote-hero"
              style={{ transform: `translate3d(${at.x - 30}px, ${at.y - 88}px, 0)`, zIndex: at.y }}
            >
              <span className="remote-tag" style={{ borderColor: p.color }}>
                {p.name}
              </span>
              <Hero scarf={p.color} className={`${at.walking ? 'walking' : ''} ${at.flip ? 'flip' : ''}`} label={`Герой игрока ${p.name}`} />
            </div>
          );
        })}
    </>
  );
}
