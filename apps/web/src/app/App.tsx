import AppRoutes from '../router';

import { Providers } from './Providers';

function App() {
  return (
    <Providers>
      <AppRoutes />
    </Providers>
  );
}

export default App;
