import { CollectionPageLayout } from '@felipechandiadev/ui';
import { getTraysWithStockForDispatch } from '@/app/actions/dispatches';
import { getCustomersSimpleListWithLabel } from '@/app/actions/customers';
import { getStoragesSimpleListWithLabel } from '@/app/actions/storages';
import NewDispatchContent from './ui/NewDispatchContent';

export const dynamic = 'force-dynamic';

export default async function NewDispatchPage() {
  const [customerOptions, trayOptions, storageOptions] = await Promise.all([
    getCustomersSimpleListWithLabel(),
    getTraysWithStockForDispatch(),
    getStoragesSimpleListWithLabel(),
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
        storageOptions={storageOptions}
      />
    </CollectionPageLayout>
  );
}
