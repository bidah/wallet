import React from 'react'
import { useTranslation } from 'react-i18next'
import { APP_NAME } from 'src/brandingConfig'
import Dialog from 'src/components/Dialog'
import { inviteModal } from 'src/images/Images'
import useSelector from 'src/redux/useSelector'
import { inviteRewardCusdSelector } from 'src/send/selectors'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { Currency } from 'src/utils/currencies'

interface Props {
  isVisible: boolean
  name: string
  onInvite: () => void
  onCancel?: () => void
}

export default function InviteAndSendModal({ isVisible, name, onInvite, onCancel }: Props) {
  const { t } = useTranslation()
  const rewardAmount = useSelector(inviteRewardCusdSelector)

  const { IS_IN_EUROPE } = useCountryFeatures()
  const currency = IS_IN_EUROPE ? Currency.Euro : Currency.Dollar

  return (
    <Dialog
      title={t('inviteAndSendDialog.title', { name, appName: APP_NAME })}
      isVisible={isVisible}
      actionText={t('inviteAndSendDialog.button')}
      actionPress={onInvite}
      secondaryActionText={t('cancel')}
      secondaryActionPress={onCancel}
      image={inviteModal}
      testID="InviteAndSendModal"
    >
      {t('inviteAndSendDialog.body', { name, amount: rewardAmount, currency })}
    </Dialog>
  )
}