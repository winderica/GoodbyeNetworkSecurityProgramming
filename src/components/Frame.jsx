import { observer } from 'mobx-react';
import React, { useEffect } from 'react';

import { Notifier } from './Notifier';
import { CertsDialog } from './CertsDialog';
import { useStores } from '../hooks/useStores';

export const Frame = observer(({ children }) => {
    const { certsStore } = useStores();
    useEffect(() => {
        void (async () => {
            await certsStore.load();
        })();
    }, []);
    return (!certsStore.ca || !certsStore.cert || !certsStore.key) ? <CertsDialog /> : (
        <div style={{ height: '100%' }}>
            {children}
            <Notifier />
        </div>
    );
});
