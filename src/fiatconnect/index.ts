import {
  AddFiatAccountResponse,
  CryptoType,
  FiatType,
  QuoteErrorResponse,
  QuoteRequestQuery,
  QuoteResponse,
} from '@fiatconnect/fiatconnect-types'
import { CICOFlow } from 'src/fiatExchanges/utils'
import networkConfig from 'src/web3/networkConfig'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { CiCoCurrency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

const TAG = 'FIATCONNECT'

export interface FiatConnectProviderInfo {
  id: string
  providerName: string
  imageUrl: string
  baseUrl: string
}

// A bit hacky. This function returns the currency code if localCurrency is in
// FiatType and otherwise returns undefined
// This assumes that the enum values match which is a fairly safe assumption since they both use ISO 4217
function convertToFiatConnectFiatCurrency(localCurrency: LocalCurrencyCode): FiatType | undefined {
  return FiatType[(localCurrency as unknown) as FiatType]
}

function convertToFiatConnectCryptoCurrency(cicoCurrency: CiCoCurrency): CryptoType {
  return {
    [CiCoCurrency.CELO]: CryptoType.CELO,
    [CiCoCurrency.CEUR]: CryptoType.cEUR,
    [CiCoCurrency.CUSD]: CryptoType.cUSD,
    [CiCoCurrency.CREAL]: CryptoType.cREAL,
  }[cicoCurrency]
}

/**
 * Get a list of FiatConnect providers.
 *
 * Queries a cloud function for static information about FiatConnect providers.
 */
export async function getFiatConnectProviders(
  address: string,
  providerList?: string
): Promise<FiatConnectProviderInfo[]> {
  const response = await fetch(
    `${networkConfig.getFiatConnectProvidersUrl}?address=${address}&providers=${providerList}`
  )
  if (!response.ok) {
    Logger.error(
      TAG,
      `Failure response fetching FiatConnect providers: ${response} , returning empty list`
    )
    return []
  }
  const { providers } = await response.json()
  return providers
}

export type QuotesInput = {
  fiatConnectProviders: FiatConnectProviderInfo[]
  flow: CICOFlow
  localCurrency: LocalCurrencyCode
  digitalAsset: CiCoCurrency
  cryptoAmount: number
  country: string
}

export type GetFiatConnectQuotesResponse = {
  id: string
  ok: boolean
  val: QuoteResponse | QuoteErrorResponse | { error: string }
}

export type FiatConnectQuoteError = {
  provider: FiatConnectProviderInfo
  ok: boolean
} & (QuoteErrorResponse | { error: string })

export type FiatConnectQuoteSuccess = {
  provider: FiatConnectProviderInfo
  ok: boolean
} & QuoteResponse

export async function getFiatConnectQuotes(
  params: QuotesInput
): Promise<(FiatConnectQuoteSuccess | FiatConnectQuoteError)[]> {
  const { fiatConnectProviders, localCurrency, digitalAsset, cryptoAmount, country, flow } = params
  const fiatType = convertToFiatConnectFiatCurrency(localCurrency)
  if (!fiatType) return []
  const cryptoType = convertToFiatConnectCryptoCurrency(digitalAsset)
  const quoteParams: QuoteRequestQuery = {
    fiatType,
    cryptoType,
    cryptoAmount: cryptoAmount.toString(),
    country,
  }
  const providers = fiatConnectProviders.map((provider) => provider.id).join(',')
  const queryParams = new URLSearchParams({
    ...(quoteParams as Record<string, string>),
    providers,
    quoteType: flow === CICOFlow.CashIn ? 'in' : 'out',
  }).toString()
  const response = await fetch(`${networkConfig.getFiatConnectQuotesUrl}?${queryParams}`)
  if (!response.ok) {
    const err = await response.json()
    Logger.error(TAG, `Failure response fetching FiatConnect quotes: ${err} , returning empty list`)
    return []
  }
  const results: { quotes: GetFiatConnectQuotesResponse[] } = await response.json()
  return results.quotes.map((result) => ({
    ...result.val,
    ok: result.ok,
    provider: fiatConnectProviders.find((provider) => provider.id === result.id)!,
  }))
}
export type FetchQuotesInput = Omit<QuotesInput, 'fiatConnectProviders'> & {
  fiatConnectCashInEnabled: boolean
  fiatConnectCashOutEnabled: boolean
  account: string
}

export async function fetchFiatConnectQuotes(params: FetchQuotesInput) {
  const { account, fiatConnectCashInEnabled, fiatConnectCashOutEnabled, ...quotesInput } = params
  if (!fiatConnectCashInEnabled && params.flow === CICOFlow.CashIn) return []
  if (!fiatConnectCashOutEnabled && params.flow === CICOFlow.CashOut) return []
  const fiatConnectProviders = await getFiatConnectProviders(account)
  return getFiatConnectQuotes({
    ...quotesInput,
    fiatConnectProviders,
  })
}

export async function addNewFiatAccount(
  providerURL: string,
  fiatAccountSchema: string,
  properties: any
): Promise<AddFiatAccountResponse> {
  // TODO: use the SDK to make the request once SDK is published
  throw new Error('Not implemented')
}
