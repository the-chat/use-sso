import useLogs from "@the-chat/use-logs"
import { useTranslation } from "next-i18next"
import { BaseUserData } from "@the-chat/types"
import axios from "axios"
import { Auth, signInWithCustomToken } from "firebase/auth"
import { getQuery, setQuery } from "@the-chat/query"
import { useRouter } from "next/router"
import { useUser } from "@the-chat/use-user"
import { UseMyContext } from "@the-chat/gen-context"
import { useEffect } from "react"
import { SSO } from "@the-chat/config"

const getSSO = (auth: Auth, SSOHost: string = SSO.DEFAULT_SSO_HOST) => {
  const getSSOLink = () =>
    setQuery(SSOHost, {
      "return-url": location.toString(),
    })

  const useSSO = () => {
    const data = useUser()
    const [user, , { loading, error }] = data
    const { replace } = useRouter()
    const { t } = useTranslation("sso")
    const { handleError } = useLogs(() => {})

    const signInLocally = () => {
      if (!user && !loading && !error) {
        const query = getQuery(location.toString())

        // if user right now signed in globally
        if (query.token)
          return signInWithCustomToken(auth, query["token"]).catch(
            handleError(t("error.sign-in-token"))
          )

        axios(SSOHost + SSO.getSSOTokenUrl)
          .then(({ data }) => {
            if (data.code)
              switch (data.code) {
                // if user not signed in globally
                case "not-signed-in":
                  replace(getSSOLink())
                  break
              }
            else if (data.token)
              // if user signed in globally
              signInWithCustomToken(auth, data.token).catch(
                handleError(t("error.sign-in-token"))
              )
            else handleError(t("error.get-token-code-" + data.code))()
          })
          .catch(handleError(t("error.get-token-request")))
      }
    }

    useEffect(() => {
      signInLocally()
    }, [])
  }

  return { getSSOLink, useSSO }
}

export default getSSO
