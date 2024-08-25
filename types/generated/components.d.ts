import type { Schema, Attribute } from '@strapi/strapi';

export interface SharedSeo extends Schema.Component {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    metaTitle: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    metaDescription: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 50;
        maxLength: 160;
      }>;
    metaImage: Attribute.Media<'images' | 'files' | 'videos'> &
      Attribute.Required;
    metaSocial: Attribute.Component<'shared.meta-social', true>;
    keywords: Attribute.Text;
    metaRobots: Attribute.String;
    structuredData: Attribute.JSON;
    metaViewport: Attribute.String;
    canonicalURL: Attribute.String;
  };
}

export interface SharedMetaSocial extends Schema.Component {
  collectionName: 'components_shared_meta_socials';
  info: {
    displayName: 'metaSocial';
    icon: 'project-diagram';
  };
  attributes: {
    socialNetwork: Attribute.Enumeration<['Facebook', 'Twitter']> &
      Attribute.Required;
    title: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 65;
      }>;
    image: Attribute.Media<'images' | 'files' | 'videos'>;
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

export interface SharedDictionary extends Schema.Component {
  collectionName: 'components_shared_dictionaries';
  info: {
    displayName: 'Dictionary';
    description: '';
  };
  attributes: {
    key: Attribute.String & Attribute.Required;
    value: Attribute.Text & Attribute.Required;
  };
}

export interface RegistrationRegistration extends Schema.Component {
  collectionName: 'components_registration_registrations';
  info: {
    displayName: 'Registration';
    icon: 'info-circle';
    description: '';
  };
  attributes: {
    link: Attribute.String;
    widgetCode: Attribute.Text;
  };
}

export interface LocationAddress extends Schema.Component {
  collectionName: 'components_location_addresses';
  info: {
    displayName: 'Address';
    icon: 'map-pin';
    description: '';
  };
  attributes: {
    street: Attribute.String & Attribute.Required;
    postalCode: Attribute.String;
    city: Attribute.String & Attribute.Required;
    area: Attribute.String;
  };
}

export interface GamesRatings extends Schema.Component {
  collectionName: 'components_games_ratings';
  info: {
    displayName: 'Ratings';
    description: '';
  };
  attributes: {
    energy: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 5;
        },
        number
      >;
    connection: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 5;
        },
        number
      >;
    silliness: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 5;
        },
        number
      >;
  };
}

export interface EventsTimetable extends Schema.Component {
  collectionName: 'components_events_timetables';
  info: {
    displayName: 'Timetable';
    icon: 'calendar';
    description: '';
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

export interface EventsTimeSlots extends Schema.Component {
  collectionName: 'components_events_time_slots';
  info: {
    displayName: 'Timeslots';
    icon: 'stopwatch';
    description: '';
  };
  attributes: {
    time: Attribute.Time & Attribute.Required;
    description: Attribute.String & Attribute.Required;
  };
}

export interface EventsSponsorship extends Schema.Component {
  collectionName: 'components_events_sponsorships';
  info: {
    displayName: 'Sponsorship';
    icon: 'address-book';
    description: '';
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

export interface EventsMedia extends Schema.Component {
  collectionName: 'components_events_media';
  info: {
    displayName: 'Media';
    icon: 'photo-video';
  };
  attributes: {
    url: Attribute.String & Attribute.Required;
    type: Attribute.Enumeration<['Photos', 'Videos']> & Attribute.Required;
  };
}

export interface DefaultHistoryItem extends Schema.Component {
  collectionName: 'components_default_history_items';
  info: {
    displayName: 'HistoryItem';
    description: '';
  };
  attributes: {
    date: Attribute.Date & Attribute.Required;
    dateFormat: Attribute.Enumeration<['Year', 'Month', 'Day']>;
    additionalText: Attribute.String;
    title: Attribute.String & Attribute.Required;
    description: Attribute.RichText &
      Attribute.Required &
      Attribute.CustomField<
        'plugin::ckeditor5.CKEditor',
        {
          preset: 'toolbar';
        }
      >;
    image: Attribute.Media<'images'> & Attribute.Required;
  };
}

export interface ContactSocialNetwork extends Schema.Component {
  collectionName: 'components_contact_social_networks';
  info: {
    displayName: 'SocialNetwork';
    icon: 'address-card';
    description: '';
  };
  attributes: {
    url: Attribute.String;
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
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'shared.seo': SharedSeo;
      'shared.meta-social': SharedMetaSocial;
      'shared.list': SharedList;
      'shared.dictionary': SharedDictionary;
      'registration.registration': RegistrationRegistration;
      'location.address': LocationAddress;
      'games.ratings': GamesRatings;
      'events.timetable': EventsTimetable;
      'events.time-slots': EventsTimeSlots;
      'events.sponsorship': EventsSponsorship;
      'events.media': EventsMedia;
      'default.history-item': DefaultHistoryItem;
      'contact.social-network': ContactSocialNetwork;
    }
  }
}
