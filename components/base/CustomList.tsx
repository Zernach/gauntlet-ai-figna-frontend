import { ENVIRONMENT } from '@/constants/config';
import React from 'react';
import {
  FlatList,
  FlatListProps,
  ScrollView,
  ScrollViewProps,
} from 'react-native';

type WithFlatListProps<ItemT> = {
  flatListProps: FlatListProps<ItemT>;
  scrollViewProps?: never;
};

type WithScrollViewProps = {
  flatListProps?: never;
  scrollViewProps: ScrollViewProps;
};

export type CustomListProps<ItemT> =
  | WithFlatListProps<ItemT>
  | WithScrollViewProps;

export function CustomList<ItemT = unknown>(props: CustomListProps<ItemT>) {
  if ('flatListProps' in props && props.flatListProps) {
    return <FlatList {...props.flatListProps} />;
  }

  if ('scrollViewProps' in props && props.scrollViewProps) {
    return <ScrollView {...props.scrollViewProps} />;
  }

  if (ENVIRONMENT !== 'prod') {
    throw new Error(
      'CustomList requires either flatListProps or scrollViewProps.',
    );
  }

  return null;
}

CustomList.displayName = 'CustomList';
