import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';

import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../hooks/auth';

import api from '../../services/api';

import {
  Container, Header, BackButton,
  HeaderTitle, UserAvatar, ProvidersListContainer,
  ProvidersList, ProviderContainer, ProviderAvatar,
  ProviderName,
} from './styles';

import { Provider } from '../Dashboard';

interface RouteParams {
    providerId: string;
}

const CreateAppointment: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute();
  const { goBack } = useNavigation();
  const { providerId } = route.params as RouteParams;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(providerId);

  useEffect(() => {
    api.get('/providers').then((response) => {
      setProviders(response.data);
    });
  }, []);

  const navigateBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSelectProvider = useCallback((changedProviderId) => {
    setSelectedProvider(changedProviderId);
  }, []);

  return (
    <Container>
      <Header>
        <BackButton onPress={navigateBack}>
          <Icon name="chevron-left" size={24} color="#999591" />
        </BackButton>

        <HeaderTitle>
          Cabeleireiros
        </HeaderTitle>

        <UserAvatar source={{ uri: user.avatarUrl }} />
      </Header>

      <ProvidersListContainer>
        <ProvidersList
          data={providers}
          keyExtractor={(provider) => provider.id}
          renderItem={({ item: provider }) => (
            <ProviderContainer
              onPress={() => handleSelectProvider(provider.id)}
              selected={provider.id === selectedProvider}
            >
              <ProviderAvatar source={{ uri: provider.avatarUrl }} />
              <ProviderName selected={provider.id === selectedProvider}>
                {provider.name}
              </ProviderName>
            </ProviderContainer>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </ProvidersListContainer>

    </Container>
  );
};

export default CreateAppointment;
