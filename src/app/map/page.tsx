'use client';

import dynamic from 'next/dynamic';

const IndiaMapDijkstra = dynamic(() => import('../../components/IndiaMapDijkstra'), {
  ssr: false,
});

export default function MapPage() {
  return <IndiaMapDijkstra />;
}


