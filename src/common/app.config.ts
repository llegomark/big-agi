/**
 * Application Identity (Brand)
 *
 * Also note that the 'Brand' is used in the following places:
 *  - README.md               all over
 *  - package.json            app-slug and version
 *  - [public/manifest.json]  name, short_name, description, theme_color, background_color
 */
export const Brand = {
  Title: {
    Base: 'Chat - Mark Anthony Llego',
    Common: (process.env.NODE_ENV === 'development' ? '[DEV] ' : '') + 'Chat - Mark Anthony Llego',
  },
  Meta: {
    Description:
      'Engage with our ChatGPT UI Alternative! Dive deep into its features, understand its nuances, and discover a new way to communicate with cutting-edge AI technology.',
    SiteName: 'Chat - Mark Anthony Llego',
    ThemeColor: '#32383E',
    TwitterSite: '@markllego',
  },
  URIs: {
    Home: 'https://lego.dev/',
    App: 'https://chat.llego.dev/',
    CardImage: 'https://chat.llego.dev/icons/card-dark-1200.jpg',
    OpenRepo: 'https://github.com/llegomark',
    SupportInvite: 'https://discordapp.com/users/1012984419029622784',
    Twitter: 'https://www.twitter.com/markllego',
    PrivacyPolicy: 'https://llego.dev/legal/',
  },
};
