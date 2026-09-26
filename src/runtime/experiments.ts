import {reactive} from 'vue';
// Display-only experiments; never retain or mutate game state.
export const experiments=reactive({wardrobePaged:false,shopDeferredPaint:false});
