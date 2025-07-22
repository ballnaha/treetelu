import ClientComponent from './client';
import { metadata } from './metadata';
import StructuredData from '@/components/StructuredData';

export { metadata };

export default function Page() {
  return (
    <>
      <StructuredData type="homepage" />
      <ClientComponent />
    </>
  );
}
