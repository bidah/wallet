import {
  AccountNumber,
  FiatAccountSchema,
  FiatAccountType,
  FiatConnectError,
} from '@fiatconnect/fiatconnect-types'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError, showMessage } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BorderlessButton from 'src/components/BorderlessButton'
import Button, { BtnSizes } from 'src/components/Button'
import TextInput from 'src/components/TextInput'
import { addNewFiatAccount } from 'src/fiatconnect'
import i18n from 'src/i18n'
import ForwardChevron from 'src/icons/ForwardChevron'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'

const TAG = 'FiatDetailsScreen'
type ScreenProps = StackScreenProps<StackParamList, Screens.FiatDetailsScreen>

type Props = ScreenProps

interface Fields {
  name: string
  label: string
  regex: RegExp
  placeholderText: string
  errorMessage: string
}

// This is a mapping between different fiat account schema to the metadata of the fields that need to be rendered on the bank details screen
const SCHEMA_TO_FIELD_METADATA_MAP = {
  AccountNumber: [
    {
      name: 'accountName',
      label: i18n.t('fiatAccountSchema.accountName.label'),
      regex: /.*?/,
      placeholderText: i18n.t('fiatAccountSchema.accountName.placeholderText'),
      errorMessage: i18n.t('fiatAccountSchema.accountName.errorMessage'),
    },
    {
      name: 'institutionName',
      label: i18n.t('fiatAccountSchema.institutionName.label'),
      regex: /.*?/,
      placeholderText: i18n.t('fiatAccountSchema.institutionName.placeholderText'),
      errorMessage: i18n.t('fiatAccountSchema.institutionName.errorMessage'),
    },
    {
      name: 'accountNumber',
      label: i18n.t('fiatAccountSchema.accountNumber.label'),
      regex: /^[0-9]{10}$/,
      placeholderText: i18n.t('fiatAccountSchema.accountNumber.placeholderText'),
      errorMessage: i18n.t('fiatAccountSchema.accountNumber.errorMessage'),
    },
  ],
}

// We need to compare the body collected from form to the Interface of the fiat account schema
// This is a helper function that returns a dummy object of FiatAccountSchema to iterate over
const getSchemaObjectByType = (fiatAccountSchema: FiatAccountSchema) => {
  let newSchema: AccountNumber | undefined
  switch (fiatAccountSchema) {
    case FiatAccountSchema.AccountNumber:
      newSchema = {
        accountName: '',
        institutionName: '',
        accountNumber: '',
        country: '',
        fiatAccountType: FiatAccountType.BankAccount,
      }
      break
    default:
      newSchema = undefined
  }

  return newSchema
}

const FiatDetailsScreen = ({ route, navigation }: Props) => {
  const { t } = useTranslation()
  const { providerURL, fiatAccountSchema, allowedValues, cicoQuote } = route.params
  const [validInputs, setValidInputs] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [errors, setErrors] = useState(new Set<string>())
  const inputRefs = useRef<string[]>([textValue])
  const userCountry = useSelector(userLocationDataSelector)

  const dispatch = useDispatch()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: i18n.t('fiatDetailsScreen.header'),
    })
  }, [navigation])

  const getFieldsBySchema = (fiatAccountSchema: FiatAccountSchema): Fields[] => {
    return SCHEMA_TO_FIELD_METADATA_MAP[fiatAccountSchema]
  }

  const formFields = useMemo(() => {
    const fields = getFieldsBySchema(fiatAccountSchema)

    for (let i = 0; i < fields.length; i++) {
      inputRefs.current.push('')
    }
    return fields
  }, [fiatAccountSchema])

  const onPressNext = async () => {
    validateInput()

    if (validInputs) {
      const body: Record<string, string> = {}
      for (let i = 0; i < formFields.length; i++) {
        body[formFields[i].name] = inputRefs.current[i]
      }

      const validatedBody = validateAndCompleteSchema(
        body,
        getSchemaObjectByType(fiatAccountSchema)
      )

      await addNewFiatAccount(providerURL, fiatAccountSchema, validatedBody)
        .then((data) => {
          // TODO Tracking here
          dispatch(showMessage(t('fiatDetailsScreen.addFiatAccountSuccess')))
        })
        .catch((error) => {
          // TODO Tracking here
          if (error === FiatConnectError.ResourceExists) {
            dispatch(showError(ErrorMessages.ADD_FIAT_ACCOUNT_RESOURCE_EXIST))
          } else {
            dispatch(showError(t('fiatDetailsScreen.addFiatAccountFailed')))
          }
          Logger.error(TAG, `Error adding fiat account: ${error}`)
        })

      // TODO: navigate to the next screen
    }
  }

  const validateAndCompleteSchema = (
    body: Record<string, string>,
    schemaObject: AccountNumber | undefined
  ): Record<string, string> | undefined => {
    if (!schemaObject) {
      Logger.error(TAG, 'Cannot create a schema object, check the schema passed from the Prop')
      return
    }

    for (const [key, val] of Object.entries(schemaObject)) {
      if (!body[key]) {
        if (key === 'country') {
          if (!userCountry) {
            Logger.error(TAG, 'User country is not available from redux')
            return
          }
          body[key] = userCountry.countryCodeAlpha2 || ''
        } else if (key === 'fiatAccountType') {
          body[key] = FiatAccountType.BankAccount
        }
      }
    }
    return body
  }

  const onPressSelectedPaymentOption = () => {
    // TODO: tracking here
    // TODO: navigate to SelectProvider screen
  }

  const validateInput = () => {
    setValidInputs(false)
    const newErrorSet = new Set<string>()

    let hasEmptyFields = false
    formFields.forEach((field, index) => {
      const fieldVal = inputRefs.current[index].trim()

      if (!fieldVal) {
        hasEmptyFields = true
      } else if (!field.regex.test(fieldVal)) {
        newErrorSet.add(field.name)
      }
    })

    setErrors(newErrorSet)
    setValidInputs(!hasEmptyFields && newErrorSet.size === 0)
  }

  const setInputValue = (value: string, index: number) => {
    inputRefs.current[index] = value
    setTextValue(value)

    validateInput()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {formFields.map((field, index) => {
          return (
            <View style={styles.inputView} key={`inputField-${index}`}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              <TextInput
                testID={`input-${field.name}`}
                style={styles.formInput}
                value={inputRefs.current[index]}
                placeholder={field.placeholderText}
                onChangeText={(value) => setInputValue(value, index)}
              />
              {errors.has(field.name) && (
                <Text testID="errorMessage" style={styles.error}>
                  {field.errorMessage}
                </Text>
              )}
            </View>
          )
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.paymentOption}>
          <BorderlessButton onPress={onPressSelectedPaymentOption} testID="selectedProviderButton">
            <View style={styles.paymentOptionButton}>
              <Text style={styles.paymentOptionText}>
                {t('fiatDetailsScreen.selectedPaymentOption')}
              </Text>
              <ForwardChevron color={colors.gray4} />
              <Image
                source={{
                  uri: cicoQuote.provider.logo,
                }}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
          </BorderlessButton>
        </View>
        <View>
          <Button
            testID="nextButton"
            text={t('next')}
            onPress={onPressNext}
            disabled={!validInputs}
            style={styles.nextButton}
            size={BtnSizes.FULL}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 24,
    paddingVertical: 4,
    flex: 1,
  },
  inputLabel: {
    ...fontStyles.regular500,
    paddingBottom: 4,
  },
  inputView: {
    paddingVertical: 12,
  },
  formInput: {
    ...fontStyles.regular,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.gray2,
    marginBottom: 4,
    color: colors.dark,
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  error: {
    fontSize: 12,
    color: '#FF0000', // color red
  },
  footer: {
    flex: 1,
    flexDirection: 'column',
    paddingBottom: 28,
  },
  paymentOption: {
    flex: 1,
    color: colors.gray2,
    marginBottom: 4,
    justifyContent: 'center',
  },
  paymentOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  paymentOptionText: {
    ...fontStyles.regular,
    color: colors.gray4,
    marginLeft: 16,
    paddingRight: 4,
  },
  iconImage: {
    marginLeft: 16,
    height: 48,
    width: 48,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
})
export default FiatDetailsScreen