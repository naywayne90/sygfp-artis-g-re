# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - img "ARTI" [ref=e6]
    - generic [ref=e7]:
      - generic [ref=e8]:
        - heading "SYGFP" [level=3] [ref=e9]
        - paragraph [ref=e10]: Système de Gestion Financière Publique
      - generic [ref=e11]:
        - heading "Connectez-vous à votre compte" [level=2] [ref=e12]
        - alert [ref=e13]:
          - img [ref=e14]
          - generic [ref=e16]: Identifiants invalides. Vérifiez votre email et mot de passe.
        - generic [ref=e17]:
          - generic [ref=e18]:
            - text: Adresse email
            - generic [ref=e19]:
              - img [ref=e20]
              - textbox "Adresse email" [ref=e23]:
                - /placeholder: votre.email@exemple.com
                - text: admin@arti.ci
          - generic [ref=e24]:
            - text: Mot de passe
            - generic [ref=e25]:
              - img [ref=e26]
              - textbox "Mot de passe" [ref=e29]:
                - /placeholder: Votre mot de passe
                - text: Test2026!
              - button [ref=e30] [cursor=pointer]:
                - img [ref=e31]
          - button "Se connecter" [ref=e34] [cursor=pointer]
        - button "Mot de passe oublié ?" [ref=e36] [cursor=pointer]
    - paragraph [ref=e37]: © 2025 ARTI - Tous droits réservés
```