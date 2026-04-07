import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {playerService} from '../services/playerService';
import {Player} from '../types';
import {getPositionName, getOverallRatingColor} from '../utils';

export const SquadScreen: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlayers = async () => {
    try {
      const response = await playerService.getAll();
      setPlayers(response.data);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlayers();
  };

  const renderPlayer = ({item}: {item: Player}) => {
    const ratingColor = getOverallRatingColor(item.overallRating);
    
    return (
      <TouchableOpacity style={styles.playerCard}>
        <View style={styles.playerMain}>
          <View style={[styles.ratingBadge, {backgroundColor: ratingColor}]}>
            <Text style={styles.ratingText}>{item.overallRating}</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{item.name}</Text>
            <View style={styles.playerMeta}>
              <Text style={styles.positionText}>{getPositionName(item.position)}</Text>
              <Text style={styles.divider}>•</Text>
              <Text style={styles.ageText}>{item.age}岁</Text>
              <Text style={styles.divider}>•</Text>
              <Text style={styles.nationalityText}>{item.nationality}</Text>
            </View>
          </View>
        </View>
        <View style={styles.playerStats}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{item.physical?.pace || 0}</Text>
            <Text style={styles.statLabel}>速度</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{item.technical?.shooting || 0}</Text>
            <Text style={styles.statLabel}>射门</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{item.technical?.passing || 0}</Text>
            <Text style={styles.statLabel}>传球</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{item.technical?.dribbling || 0}</Text>
            <Text style={styles.statLabel}>盘带</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{item.technical?.defending || 0}</Text>
            <Text style={styles.statLabel}>防守</Text>
          </View>
        </View>
        <View style={styles.playerValue}>
          <Text style={styles.valueLabel}>身价</Text>
          <Text style={styles.valueText}>
            ¥{(item.marketValue / 10000).toFixed(0)}万
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>球队阵容</Text>
        <Text style={styles.subtitle}>共 {players.length} 名球员</Text>
      </View>

      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无球员数据</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  playerCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  playerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  divider: {
    color: '#555',
    marginHorizontal: 6,
  },
  ageText: {
    fontSize: 12,
    color: '#aaa',
  },
  nationalityText: {
    fontSize: 12,
    color: '#aaa',
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  statColumn: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
  },
  playerValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  valueLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFC107',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
  },
});
