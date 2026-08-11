// app/index.tsx

import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Redirect } from 'expo-router';

const Page = () => {
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) return <Redirect href="/(root)/(tabs)/home" />;
  return <Redirect href="/(auth)/sign-in" />;
};

export default Page;
