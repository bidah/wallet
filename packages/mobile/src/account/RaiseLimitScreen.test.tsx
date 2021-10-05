import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { sendEmail } from 'src/account/emailSender'
import RaiseLimitScreen from 'src/account/RaiseLimitScreen'
import { KycStatus } from 'src/account/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

const createStore = (numberVerified: boolean, dailyLimitRequestStatus?: KycStatus) =>
  createMockStore({
    app: { numberVerified },
    account: { dailyLimitRequestStatus },
  })

jest.mock('src/firebase/firebase')
jest.mock('src/account/emailSender')

describe('RaiseLimitScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createStore(true)}>
        <RaiseLimitScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("when application wasn't started there's no status and button is enabled", async () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={createStore(true)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByTestId('ApplicationStatus')).toBeFalsy()
    fireEvent.press(getByTestId('RaiseLimitButton'))
    expect(sendEmail).toHaveBeenCalled()
  })

  it("when application wasn't started and number isn't verified there's no status and button takes you to verification", async () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={createStore(false)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByTestId('ApplicationStatus')).toBeFalsy()
    fireEvent.press(getByTestId('RaiseLimitButton'))
    expect(sendEmail).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationEducationScreen)
  })

  it("when application is in review there's no button", async () => {
    const { queryByTestId } = render(
      <Provider store={createStore(true, KycStatus.InReview)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByTestId('ApplicationStatus')).toBeTruthy()
    expect(queryByTestId('RaiseLimitButton')).toBeFalsy()
  })

  it("when application is in review there's no button", async () => {
    const { queryByTestId } = render(
      <Provider store={createStore(true, KycStatus.InReview)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByTestId('ApplicationStatus')).toBeTruthy()
    expect(queryByTestId('RaiseLimitButton')).toBeFalsy()
  })

  it("when application is approved there's no button", async () => {
    const { queryByTestId } = render(
      <Provider store={createStore(true, KycStatus.Approved)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByTestId('ApplicationStatus')).toBeTruthy()
    expect(queryByTestId('RaiseLimitButton')).toBeFalsy()
  })

  it("when application is incomplete there's a button that sends an email", async () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={createStore(true, KycStatus.Incomplete)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByTestId('ApplicationStatus')).toBeTruthy()
    expect(queryByTestId('RaiseLimitButton')).toBeTruthy()
    fireEvent.press(getByTestId('RaiseLimitButton'))
    expect(sendEmail).toHaveBeenCalled()
  })

  it("when application is denied there's a button that sends an email", async () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={createStore(true, KycStatus.Denied)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByTestId('ApplicationStatus')).toBeTruthy()
    expect(queryByTestId('RaiseLimitButton')).toBeTruthy()
    fireEvent.press(getByTestId('RaiseLimitButton'))
    expect(sendEmail).toHaveBeenCalled()
  })
})
