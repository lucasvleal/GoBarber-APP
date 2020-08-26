import React, {
  useCallback, useEffect, useState, useMemo,
} from 'react';
import { Platform, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { useAuth } from '../../hooks/auth';

import api from '../../services/api';

import {
  Container, Header, BackButton,
  HeaderTitle, UserAvatar, ProvidersListContainer,
  ProvidersList, ProviderContainer, ProviderAvatar,
  ProviderName, Calendar, Title,
  OpenDatePickerButton, OpenDatePickerButtonText, Schedule,
  Section, SectionTitle, SectionContent,
  Hour, HourText, CreateAppointmentButton, CreateAppointmentButtonText,
} from './styles';

import { Provider } from '../Dashboard';

interface RouteParams {
    providerId: string;
}

interface AvailabilityItem {
    hour: number;
    avaliable: boolean;
}

const CreateAppointment: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute();
  const { goBack, navigate } = useNavigation();
  const { providerId } = route.params as RouteParams;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(providerId);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);

  const [selectedHour, setSelectedHour] = useState(0);

  useEffect(() => {
    api.get('/providers').then((response) => {
      setProviders(response.data);
    });
  }, []);

  useEffect(() => {
    api.get(`/providers/${selectedProvider}/day-availability`, {
      params: {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate(),
      },
    }).then((response) => {
      setAvailability(response.data);
    });
  }, [selectedDate, selectedProvider]);

  const navigateBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSelectProvider = useCallback((changedProviderId) => {
    setSelectedProvider(changedProviderId);
  }, []);

  const handleToggleDatePicker = useCallback(() => {
    setShowDatePicker((state) => !state);
  }, []);

  const handleDateChanged = useCallback((event: any, date: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
    }
  }, []);

  const morningAvailability = useMemo(() => availability
    .filter(({ hour }) => hour < 12)
    .map(({ hour, avaliable }) => ({
      hour,
      avaliable,
      hourFormatted: format(new Date().setHours(hour), 'HH:00'),
    })), [availability]);

  const afternoonAvailability = useMemo(() => availability
    .filter(({ hour }) => hour >= 12)
    .map(({ hour, avaliable }) => ({
      hour,
      avaliable,
      hourFormatted: format(new Date().setHours(hour), 'HH:00'),
    })), [availability]);

  const handleSelectHour = useCallback((hour: number) => {
    setSelectedHour(hour);
  }, []);

  const handleCreateAppointment = useCallback(async () => {
    try {
      const date = new Date(selectedDate);
      date.setHours(selectedHour);
      date.setMinutes(0);

      const dateFormatted = format(date, 'yyyy-MM-dd HH:mm');

      await api.post('/appointments', {
        provider_id: selectedProvider,
        date: dateFormatted,
      });

      navigate('AppointmentCreated', { date: date.getTime() });
    } catch (err) {
      Alert.alert(
        'Erro ao criar agendamento',
        'Ocorreu um erro ao tentar criar um agendamento. Tente novamente mais tarde',
      );

      console.log(err);
    }
  }, [selectedHour, navigate, selectedDate, selectedProvider]);

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

      <Calendar>
        <Title>Escolha a data</Title>

        <OpenDatePickerButton onPress={handleToggleDatePicker}>
          <OpenDatePickerButtonText>Selecionar outra data</OpenDatePickerButtonText>
        </OpenDatePickerButton>

        {
            showDatePicker && (
            <DateTimePicker
              mode="date"
              display="calendar"
              value={selectedDate}
              onChange={handleDateChanged}
            />
            )
        }
      </Calendar>

      <Schedule>
        <Title>Escolha o horário</Title>

        <Section>
          <SectionTitle>Manhã</SectionTitle>

          <SectionContent>
            {
                    morningAvailability.map(({ hourFormatted, avaliable, hour }) => (
                      <Hour
                        enabled={avaliable}
                        selected={selectedHour === hour}
                        available={avaliable}
                        key={hour}
                        onPress={() => handleSelectHour(hour)}
                      >
                        <HourText selected={selectedHour === hour}>{hourFormatted}</HourText>
                      </Hour>
                    ))
                }
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>Tarde</SectionTitle>

          <SectionContent>
            {
                    afternoonAvailability.map(({ hourFormatted, avaliable, hour }) => (
                      <Hour
                        enabled={avaliable}
                        selected={selectedHour === hour}
                        available={avaliable}
                        key={hour}
                        onPress={() => handleSelectHour(hour)}
                      >
                        <HourText selected={selectedHour === hour}>{hourFormatted}</HourText>
                      </Hour>
                    ))
                }
          </SectionContent>
        </Section>
      </Schedule>

      <CreateAppointmentButton onPress={handleCreateAppointment}>
        <CreateAppointmentButtonText>Agendar</CreateAppointmentButtonText>
      </CreateAppointmentButton>
    </Container>
  );
};

export default CreateAppointment;
