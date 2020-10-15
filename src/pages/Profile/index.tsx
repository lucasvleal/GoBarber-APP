import React, { useRef, useCallback } from 'react';
import {
  View, KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Feather';
import ImagePicker from 'react-native-image-picker';

import { useAuth } from '../../hooks/auth';
import api from '../../services/api';

import Input from '../../components/Input';
import Button from '../../components/Button';

import {
  Container, Title, UserAvatarButton, UserAvatar, BackButton,
} from './styles';

import getValidationErrors from '../../utils/getValidationErrors';

interface ProfileFormData {
    name: string;
    email: string;
    oldPassword: string;
    password: string;
    passwordConfirmation: string;
}

const Profile: React.FC = () => {
  const { user, updateUser, signOut } = useAuth();
  const formRef = useRef<FormHandles>(null);
  const emailInputRef = useRef<TextInput>(null);

  const oldPasswordInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const passwordConfirmationInputRef = useRef<TextInput>(null);

  const navigation = useNavigation();

  const handleSubmit = useCallback(async (data: ProfileFormData) => {
    try {
      formRef.current?.setErrors({});

      const schema = Yup.object().shape({
        name: Yup.string().required('Nome é obrigatório'),
        email: Yup.string().required('Email é obrigatório').email('Digite um email válido'),
        oldPassword: Yup.string(),
        password: Yup.string().when('oldPassword', {
          is: (val) => !!val.length,
          then: Yup.string().required('Campo obrigatório'),
          otherwise: Yup.string(),
        }),
        passwordConfirmation: Yup.string()
          .when('password', {
            is: (val) => !!val.length,
            then: Yup.string().required().min(6, 'A senha deve ter no mínimo 6 dígitos!'),
            otherwise: Yup.string(),
          })
          .oneOf([Yup.ref('password')], 'Confirmação incorreta'),
      });

      await schema.validate(data, {
        abortEarly: false,
      });

      const formData = {
        name: data.name,
        email: data.email,
        ...(data.oldPassword ? {
          oldPassword: data.oldPassword,
          password: data.password,
          passwordConfirmation: data.passwordConfirmation,
        } : {}),
      };

      const response = await api.put('/profile', formData);

      updateUser(response.data);

      Alert.alert('Perfil atualizado!', '', [
        {
          text: 'OK', onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors = getValidationErrors(err);

            formRef.current?.setErrors(errors);

            return;
      }

      Alert.alert('Erro na atualização', 'Ocorreu um erro ao atualizar seu perfil, tente novamente.');
      console.log(err);
    }
  }, [navigation, updateUser]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleUpdateAvatar = useCallback(() => {
    ImagePicker.showImagePicker({
      title: 'Selecione um avatar',
      cancelButtonTitle: 'Cancelar',
      takePhotoButtonTitle: 'Usar câmera',
      chooseFromLibraryButtonTitle: 'Escolher da galeria',
    }, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.error) {
        Alert.alert('Erro ao atualizar seu avatar', response.error);
        return;
      }

      const data = new FormData();
      data.append('avatar', {
        type: 'image/jpeg',
        name: `${user.id}.jpg`,
        uri: response.uri,
      });

      api.patch('/users/avatar', data).then((resp) => {
        updateUser(resp.data);
      });
    });
  }, [user.id, updateUser]);

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled
      >
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Container>
            <BackButton onPress={handleGoBack}>
              <Icon name="chevron-left" size={32} color="#999591" />
            </BackButton>

            <UserAvatarButton onPress={handleUpdateAvatar}>
              <UserAvatar source={{ uri: user.avatarUrl }} />
            </UserAvatarButton>

            <View>
              <Title>Meu perfil</Title>
            </View>

            <Form initialData={user} style={{ width: '100%' }} ref={formRef} onSubmit={handleSubmit}>
              <Input
                autoCapitalize="words"
                name="name"
                icon="user"
                placeholder="Nome"
                returnKeyType="next"
                onSubmitEditing={() => {
                    emailInputRef.current?.focus();
                }}
              />

              <Input
                ref={emailInputRef}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={{ marginBottom: 16 }}
                autoCorrect={false}
                name="email"
                icon="mail"
                placeholder="E-mail"
                returnKeyType="next"
                onSubmitEditing={() => {
                    oldPasswordInputRef.current?.focus();
                }}
              />

              <Input
                ref={oldPasswordInputRef}
                name="oldPassword"
                icon="lock"
                placeholder="Senha atual"
                textContentType="newPassword"
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={() => { passwordInputRef.current?.focus(); }}
              />

              <Input
                ref={passwordInputRef}
                name="password"
                icon="lock"
                placeholder="Nova senha"
                textContentType="newPassword"
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={() => { passwordConfirmationInputRef.current?.focus(); }}
              />

              <Input
                ref={passwordConfirmationInputRef}
                name="passwordConfirmation"
                icon="lock"
                placeholder="Confirmar senha"
                textContentType="newPassword"
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={() => { formRef.current?.submitForm(); }}
              />

              <Button onPress={() => { formRef.current?.submitForm(); }}>
                Confirmar mudanças
              </Button>
            </Form>

          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default Profile;
