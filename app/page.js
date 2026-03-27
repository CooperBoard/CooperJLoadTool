'use client';
import AccessGate from '../components/access-gate';
import CooperJLoadCalculatorPro from '../components/jload-calculator';
export default function Home() {
  return (
    <AccessGate>
      <CooperJLoadCalculatorPro />
    </AccessGate>
  );
}
