import useLogs from "@the-chat/use-logs"
import { useTranslation } from "next-i18next"
import axios from "axios"
import { Auth, signInWithCustomToken } from "firebase/auth"
import { getQuery, setQuery } from "@the-chat/query"
import { useRouter } from "next/router"
import { useUser } from "@the-chat/use-user"
import { useEffect } from "react"
import { SSO } from "@the-chat/config"

const setArgsForSSO = (host: string) =>
  setQuery(host, {
    "return-url": location.toString(),
  })

// todo?: useUser handle error
const useSSO = (auth: Auth, newUser: boolean) => {
  const [, user, { loading, error }] = useUser()
  const { replace } = useRouter() || { replace() {} }
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

      axios(SSO.HOST + SSO.getSSOTokenUrl)
        .then(({ data }) => {
          if (data.code)
            switch (data.code) {
              // if user not signed in globally
              case "not-signed-in":
                newUser && replace(setArgsForSSO(SSO.HOST))
                break
            }
          else if (data.token) {
            // if user signed in globally
            signInWithCustomToken(auth, data.token)
              .then(() => {
                window.history.replaceState(
                  null,
                  "",
                  setQuery(location.toString(), (prevQuery) => {
                    delete prevQuery.token

                    return prevQuery
                  })
                )
              })
              .catch(handleError(t("error.sign-in-token")))
          } else handleError(t("error.get-token-code-" + data.code))()
        })
        .catch(handleError(t("error.get-token-request")))
    }
  }

  useEffect(() => {
    signInLocally()
  }, [user, loading, error])
}

export { setArgsForSSO }
export default useSSO
