import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../hooks';
import {teamService} from '../services/teamService';
import {Team} from '../types';

export const HomeScreen: React.FC = () => {
  const {user} = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeam = async () => {
    try {
      const response = await teamService.getMyTeam();
      setTeam(response.data);
    } catch (error) {
      console.error('Failed to fetch team:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeam();
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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.header}>
          <Text style={styles.greeting}>欢迎回来，</Text>
          <Text style={styles.userName}>{user?.username || '经理'}</Text>
        </View>

        {team ? (
          <>
            <View style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamShortName}>{team.shortName}</Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{team.reputation}</Text>
                  <Text style={styles.statLabel}>声望</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{team.players?.length || 0}</Text>
                  <Text style={styles.statLabel}>球员</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{team.fans}</Text>
                  <Text style={styles.statLabel}>球迷</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>财务状况</Text>
              <View style={styles.financeCard}>
                <View style={styles.financeRow}>
                  <Text style={styles.financeLabel}>预算</Text>
                  <Text style={styles.financeValue}>
                    ¥{team.finance?.budget?.toLocaleString() || 0}
                  </Text>
                </View>
                <View style={styles.financeRow}>
                  <Text style={styles.financeLabel}>周收入</Text>
                  <Text style={[styles.financeValue, styles.income]}>
                    +¥{team.finance?.weeklyIncome?.toLocaleString() || 0}
                  </Text>
                </View>
                <View style={styles.financeRow}>
                  <Text style={styles.financeLabel}>周支出</Text>
                  <Text style={[styles.financeValue, styles.expense]}>
                    -¥{team.finance?.weeklyExpense?.toLocaleString() || 0}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>战术设置</Text>
              <View style={styles.tacticsCard}>
                <View style={styles.tacticsRow}>
                  <Text style={styles.tacticsLabel}>阵型</Text>
                  <Text style={styles.tacticsValue}>{team.tactics?.formation}</Text>
                </View>
                <View style={styles.tacticsRow}>
                  <Text style={styles.tacticsLabel}>风格</Text>
                  <Text style={styles.tacticsValue}>
                    {team.tactics?.style === 'attacking' ? '进攻型' :
                     team.tactics?.style === 'defensive' ? '防守型' :
                     team.tactics?.style === 'counter' ? '反击型' : '均衡型'}
                  </Text>
                </View>
                <View style={styles.tacticsRow}>
                  <Text style={styles.tacticsLabel}>逼抢强度</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        {width: `${team.tactics?.pressingIntensity || 50}%`}
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>设施等级</Text>
              <View style={styles.facilitiesGrid}>
                <View style={styles.facilityItem}>
                  <Text style={styles.facilityName}>体育场</Text>
                  <Text style={styles.facilityLevel}>Lv.{team.facilities?.stadiumLevel}</Text>
                </View>
                <View style={styles.facilityItem}>
                  <Text style={styles.facilityName}>训练场</Text>
                  <Text style={styles.facilityLevel}>Lv.{team.facilities?.trainingLevel}</Text>
                </View>
                <View style={styles.facilityItem}>
                  <Text style={styles.facilityName}>青训营</Text>
                  <Text style={styles.facilityLevel}>Lv.{team.facilities?.youthLevel}</Text>
                </View>
                <View style={styles.facilityItem}>
                  <Text style={styles.facilityName}>医疗中心</Text>
                  <Text style={styles.facilityLevel}>Lv.{team.facilities?.medicalLevel}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noTeamContainer}>
            <Text style={styles.noTeamText}>您还没有创建球队</Text>
            <TouchableOpacity style={styles.createTeamButton}>
              <Text style={styles.createTeamText}>创建球队</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#aaa',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#16213e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamShortName: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  financeCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  financeLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  financeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#f44336',
  },
  tacticsCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  tacticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tacticsLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  tacticsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  progressBar: {
    width: 120,
    height: 8,
    backgroundColor: '#0f3460',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  facilityItem: {
    width: '48%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  facilityName: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  facilityLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  noTeamContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noTeamText: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
  },
  createTeamButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTeamText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
