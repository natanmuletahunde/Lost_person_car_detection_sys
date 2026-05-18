import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'en';

  let messages;
  if (locale === 'am') {
    messages = (await import('../messages/am.json')).default;
  } else if (locale === 'om') {
    messages = (await import('../messages/om.json')).default;
  } else {
    messages = (await import('../messages/en.json')).default;
  }

  return {
    locale,
    messages
  };
});
