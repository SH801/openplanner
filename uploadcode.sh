#cp package.json package-dev.json
#cp package-build.json package.json
#npm run build
#cp package-dev.json package.json
scp -r -i ~/.ssh/stefanhaselwimmer_rsa build/* haselwimmer_gmail_com@35.208.248.138:/var/www/editor-wewantwind/.
#ssh -i ~/.ssh/stefanhaselwimmer_rsa haselwimmer_gmail_com@35.208.248.138
