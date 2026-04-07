import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {matchService} from '../services/matchService';

interface MatchResult {
  homeTeam: {
    id: string;
    name: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
  };
  events: any[];
  statistics: {
    possession: {home: number; away: number};
    shots: {home: number; away: number};
    shotsOnTarget: {home: number; away: number};
    corners: {home: number; away: number};
    fouls: {home: number; away: number};
    yellowCards: {home: number; away: number};
    redCards: {home: number; away: number};
  };
}

export const MatchCenterScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const simulateMatch = async () => {
    setLoading(true);
    try {
      const result = await matchService.simulate({
        homeTeamId: '69c2b5605d9106987a456f5a',
        awayTeamId: '69c2b5605d9106987a456f5a',
      });
      setMatchResult(result.data);
    } catch (error) {
      Alert.alert('错误', '模拟比赛失败');
    } finally {
      setLoading(false);
    }
  };

  const renderStatRow = (label: string, home: number, away: number) => (
    <View style={styles.statRow}>
      <Text style={styles.statHomeValue}>{home}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statAwayValue}>{away}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>比赛中心</Text>

        {!matchResult ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>准备开始一场比赛</Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={simulateMatch}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startButtonText}>开始模拟比赛</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <View style={styles.scoreBoard}>
              <View style={styles.teamSection}>
                <Text style={styles.teamName}>{matchResult.homeTeam.name}</Text>
                <Text style={styles.teamLabel}>主场</Text>
              </View>
              <View style={styles.scoreSection}>
                <Text style={styles.scoreText}>
                  {matchResult.homeTeam.score} - {matchResult.awayTeam.score}
                </Text>
              </View>
              <View style={styles.teamSection}>
                <Text style={styles.teamName}>{matchResult.awayTeam.name}</Text>
                <Text style={styles.teamLabel}>客场</Text>
              </View>
            </View>

            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>比赛统计</Text>
              
              {renderStatRow(
                '控球率',
                matchResult.statistics.possession.home,
                matchResult.statistics.possession.away,
              )}
              {renderStatRow(
                '射门',
                matchResult.statistics.shots.home,
                matchResult.statistics.shots.away,
              )}
              {renderStatRow(
                '射正',
                matchResult.statistics.shotsOnTarget.home,
                matchResult.statistics.shotsOnTarget.away,
              )}
              {renderStatRow(
                '角球',
                matchResult.statistics.corners.home,
                matchResult.statistics.corners.away,
              )}
              {renderStatRow(
                '犯规',
                matchResult.statistics.fouls.home,
                matchResult.statistics.fouls.away,
              )}
              {renderStatRow(
                '黄牌',
                matchResult.statistics.yellowCards.home,
                matchResult.statistics.yellowCards.away,
              )}
              {renderStatRow(
                '红牌',
                matchResult.statistics.redCards.home,
                matchResult.statistics.redCards.away,
              )}
            </View>

            <View style={styles.eventsCard}>
              <Text style={styles.statsTitle}>比赛事件</Text>
              {matchResult.events.slice(0, 10).map((event: any, index: number) => (
                <View key={index} style={styles.eventRow}>
                  <Text style={styles.eventMinute}>{event.minute}'</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.newMatchButton}
              onPress={() => setMatchResult(null)}>
              <Text style={styles.newMatchText}>再来一场</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    gap: 16,
  },
  scoreBoard: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  teamLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  scoreSection: {
    paddingHorizontal: 24,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  statHomeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    width: 60,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  statAwayValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
    width: 60,
    textAlign: 'center',
  },
  eventsCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  eventRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  eventMinute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFC107',
    width: 40,
  },
  eventDescription: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  newMatchButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  newMatchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
