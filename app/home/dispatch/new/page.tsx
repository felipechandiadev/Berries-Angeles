import { CollectionPageLayout } from '@felipechandiadev/ui';
import { getTraysWithStockForDispatch } from '@/app/actions/dispatches';
import { getCustomersSimpleListWithLabel } from '@/app/actions/customers';
import NewDispatchContent from './ui/NewDispatchContent';

export const dynamic = 'force-dynamic';

export default async function NewDispatchPage() {
  const [customerOptions, trayOptions] = await Promise.all([
    getCustomersSimpleListWithLabel(),
    getTraysWithStockForDispatch(),
  ]);

  return (
    <CollectionPageLayout
      title="Nuevo despacho"
      showSearch={false}
      data-test-id="new-dispatch-page"
    >
      <NewDispatchContent
        customerOptions={customerOptions}
        trayOptions={trayOptions}
      />
    </CollectionPageLayout>
  );
}
