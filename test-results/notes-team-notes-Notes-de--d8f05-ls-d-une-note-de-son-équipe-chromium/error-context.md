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
        - generic [ref=e13]:
          - generic [ref=e14]:
            - text: Adresse email
            - generic [ref=e15]:
              - img [ref=e16]
              - textbox "Adresse email" [disabled] [ref=e19]:
                - /placeholder: votre.email@exemple.com
                - text: dsi@arti.ci
          - generic [ref=e20]:
            - text: Mot de passe
            - generic [ref=e21]:
              - img [ref=e22]
              - textbox "Mot de passe" [disabled] [ref=e25]:
                - /placeholder: Votre mot de passe
                - text: Test2026!
              - button [ref=e26] [cursor=pointer]:
                - img [ref=e27]
          - button "Connexion en cours..." [disabled]:
            - img
            - text: Connexion en cours...
        - button "Mot de passe oublié ?" [ref=e31] [cursor=pointer]
    - paragraph [ref=e32]: © 2025 ARTI - Tous droits réservés
```