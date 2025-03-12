import type { Attribute, Schema } from '@strapi/strapi';

export interface ContactSocialNetwork extends Schema.Component {
  collectionName: 'components_contact_social_networks';
  info: {
    description: '';
    displayName: 'SocialNetwork';
    icon: 'address-card';
  };
  attributes: {
    type: Attribute.Enumeration<
      [
        'Twitter',
        'LinkedIn',
        'Facebook',
        'Youtube',
        'Instagram',
        'Xing',
        'Email',
        'Website',
        'Wikipedia',
        'Vimeo',
        'Other'
      ]
    >;
    url: Attribute.String;
  };
}

export interface DefaultHistoryItem extends Schema.Component {
  collectionName: 'components_default_history_items';
  info: {
    description: '';
    displayName: 'HistoryItem';
  };
  attributes: {
    additionalText: Attribute.String;
    date: Attribute.Date & Attribute.Required;
    dateFormat: Attribute.Enumeration<['Year', 'Month', 'Day']>;
    description: Attribute.RichText &
      Attribute.Required &
      Attribute.CustomField<
        'plugin::ckeditor5.CKEditor',
        {
          preset: 'toolbar';
        }
      >;
    image: Attribute.Media<'images'> & Attribute.Required;
    title: Attribute.String & Attribute.Required;
  };
}

export interface EventsMedia extends Schema.Component {
  collectionName: 'components_events_media';
  info: {
    displayName: 'Media';
    icon: 'photo-video';
  };
  attributes: {
    type: Attribute.Enumeration<['Photos', 'Videos']> & Attribute.Required;
    url: Attribute.String & Attribute.Required;
  };
}

export interface EventsSponsorship extends Schema.Component {
  collectionName: 'components_events_sponsorships';
  info: {
    description: '';
    displayName: 'Sponsorship';
    icon: 'address-book';
  };
  attributes: {
    category: Attribute.String & Attribute.Required;
    sponsors: Attribute.Relation<
      'events.sponsorship',
      'oneToMany',
      'api::sponsor.sponsor'
    >;
  };
}

export interface EventsTimeSlots extends Schema.Component {
  collectionName: 'components_events_time_slots';
  info: {
    description: '';
    displayName: 'Timeslots';
    icon: 'stopwatch';
  };
  attributes: {
    description: Attribute.String & Attribute.Required;
    time: Attribute.Time & Attribute.Required;
  };
}

export interface EventsTimetable extends Schema.Component {
  collectionName: 'components_events_timetables';
  info: {
    description: '';
    displayName: 'Timetable';
    icon: 'calendar';
  };
  attributes: {
    day: Attribute.Enumeration<
      [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ]
    > &
      Attribute.Required;
    description: Attribute.String & Attribute.Required;
    timeslots: Attribute.Component<'events.time-slots', true> &
      Attribute.Required;
  };
}

export interface GamesRatings extends Schema.Component {
  collectionName: 'components_games_ratings';
  info: {
    description: '';
    displayName: 'Ratings';
  };
  attributes: {
    connection: Attribute.Integer &
      Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    energy: Attribute.Integer &
      Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    silliness: Attribute.Integer &
      Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
  };
}

export interface LocationAddress extends Schema.Component {
  collectionName: 'components_location_addresses';
  info: {
    description: '';
    displayName: 'Address';
    icon: 'map-pin';
  };
  attributes: {
    area: Attribute.String;
    city: Attribute.String & Attribute.Required;
    postalCode: Attribute.String;
    street: Attribute.String & Attribute.Required;
  };
}

export interface RegistrationRegistration extends Schema.Component {
  collectionName: 'components_registration_registrations';
  info: {
    description: '';
    displayName: 'Registration';
    icon: 'info-circle';
  };
  attributes: {
    link: Attribute.String;
    widgetCode: Attribute.Text;
  };
}

export interface ReportingFinance extends Schema.Component {
  collectionName: 'components_reporting_finances';
  info: {
    description: '';
    displayName: 'Finance';
    icon: 'briefcase';
  };
  attributes: {
    destination: Attribute.String & Attribute.Required;
    expenses: Attribute.Decimal & Attribute.Required;
    result: Attribute.Enumeration<['Profit', 'Loss']> & Attribute.Required;
    resultAmount: Attribute.Decimal & Attribute.Required;
    revenue: Attribute.Decimal & Attribute.Required;
  };
}

export interface SharedDictionary extends Schema.Component {
  collectionName: 'components_shared_dictionaries';
  info: {
    description: '';
    displayName: 'Dictionary';
  };
  attributes: {
    key: Attribute.String & Attribute.Required;
    value: Attribute.Text & Attribute.Required;
  };
}

export interface SharedList extends Schema.Component {
  collectionName: 'components_shared_lists';
  info: {
    displayName: 'List';
  };
  attributes: {
    value: Attribute.String & Attribute.Required;
  };
}

export interface SharedMetaSocial extends Schema.Component {
  collectionName: 'components_shared_meta_socials';
  info: {
    displayName: 'metaSocial';
    icon: 'project-diagram';
  };
  attributes: {
    description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 65;
      }>;
    image: Attribute.Media<'images' | 'files' | 'videos'>;
    socialNetwork: Attribute.Enumeration<['Facebook', 'Twitter']> &
      Attribute.Required;
    title: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
  };
}

export interface SharedSeo extends Schema.Component {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    canonicalURL: Attribute.String;
    keywords: Attribute.Text;
    metaDescription: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 160;
        minLength: 50;
      }>;
    metaImage: Attribute.Media<'images' | 'files' | 'videos'> &
      Attribute.Required;
    metaRobots: Attribute.String;
    metaSocial: Attribute.Component<'shared.meta-social', true>;
    metaTitle: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    metaViewport: Attribute.String;
    structuredData: Attribute.JSON;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'contact.social-network': ContactSocialNetwork;
      'default.history-item': DefaultHistoryItem;
      'events.media': EventsMedia;
      'events.sponsorship': EventsSponsorship;
      'events.time-slots': EventsTimeSlots;
      'events.timetable': EventsTimetable;
      'games.ratings': GamesRatings;
      'location.address': LocationAddress;
      'registration.registration': RegistrationRegistration;
      'reporting.finance': ReportingFinance;
      'shared.dictionary': SharedDictionary;
      'shared.list': SharedList;
      'shared.meta-social': SharedMetaSocial;
      'shared.seo': SharedSeo;
    }
  }
}
