/* eslint-disable no-bitwise */
import React, {useEffect} from 'react';
import {ScrollView, TouchableOpacity, View} from 'react-native';
import {observer} from 'mobx-react-lite';

// import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';

import {User, Server} from 'revolt.js';

import {app, client, GeneralAvatar, openUrl} from '../../Generic';
import {BADGES, USER_IDS} from '../../lib/consts';
import {parseRevoltNodes, showToast} from '../../lib/utils';
import {Avatar, MiniProfile, RoleView} from '../../Profile';
import {currentTheme} from '../../Theme';
import {Button, ContextButton, Link, Text, Username} from '../common/atoms';
import {MarkdownView} from '../common/MarkdownView';
import {UserMenuSheet} from './index';
import {UserList} from '../navigation/UserList';

// const Image = FastImage;

export const ProfileSheet = observer(
  ({user, server}: {user: User; server?: Server}) => {
    const [section, setSection] = React.useState('Profile');
    const [profile, setProfile] = React.useState(
      {} as {content?: string | null | undefined},
    );
    const [mutual, setMutual] = React.useState(
      {} as {users: User[]; servers: Server[]},
    );
    const [showMenu, setShowMenu] = React.useState(false);

    useEffect(() => {
      async function getInfo() {
        const p = await user.fetchProfile();
        const rawMutuals =
          user.relationship !== 'User'
            ? await user.fetchMutual()
            : {users: [] as string[], servers: [] as string[]};

        const fetchedMutualUsers: User[] = [];
        for (const u of rawMutuals.users) {
          fetchedMutualUsers.push(await client.users.fetch(u));
        }

        const fetchedMutualServers: Server[] = [];
        for (const s of rawMutuals.servers) {
          fetchedMutualServers.push(await client.servers.fetch(s));
        }

        const m = {servers: fetchedMutualServers, users: fetchedMutualUsers};

        setProfile(p);
        setMutual(m);
      }
      getInfo();
    }, [user]);
    return showMenu ? (
      <UserMenuSheet state={setShowMenu} user={user} />
    ) : (
      <ScrollView>
        <View style={{flexDirection: 'row', width: '80%'}}>
          <Avatar
            size={80}
            user={user}
            server={server}
            backgroundColor={currentTheme.backgroundSecondary}
            status
            pressable
          />
          <View
            style={{
              marginLeft: '90%',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <TouchableOpacity onPress={() => setShowMenu(true)}>
              <MaterialIcon
                name="more-vert"
                size={30}
                color={currentTheme.foregroundPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flexDirection: 'row', width: '80%', marginBottom: 12}}>
          <View>
            <Username user={user} server={server} size={24} />
            <View key={1} style={{flexDirection: 'row'}}>
              {server ? (
                <>
                  {client.members.getKey({
                    server: server?._id,
                    user: user._id,
                  })?.avatar?._id !== user.avatar?._id ? (
                    <>
                      <Avatar size={24} user={user} />
                      <Text type={'header'} style={{marginLeft: 4}}>
                        @
                      </Text>
                    </>
                  ) : (
                    <Text type={'header'}>@</Text>
                  )}
                  <Username user={user} size={16} noBadge />
                </>
              ) : null}
            </View>
            {user.status?.text ? <Text>{user.status?.text}</Text> : <></>}
          </View>
        </View>
        {user.flags ? (
          user.flags & 1 ? (
            <Text style={{color: '#ff3333'}}>User is suspended</Text>
          ) : user.flags & 2 ? (
            <Text style={{color: '#ff3333'}}>User deleted their account</Text>
          ) : user.flags & 4 ? (
            <Text style={{color: '#ff3333'}}>User is banned</Text>
          ) : null
        ) : null}
        {user.relationship !== 'User' ? (
          <>
            <View style={{flexDirection: 'row'}}>
              <View
                style={{
                  margin: 3,
                  flex: 1,
                }}>
                {!user.bot ? (
                  user.relationship === 'Friend' ? (
                    <Button
                      backgroundColor={currentTheme.backgroundPrimary}
                      style={{marginHorizontal: 0}}
                      onPress={async () => {
                        const c = await user.openDM();
                        try {
                          console.log(
                            `[PROFILE] Switching to DM: ${c}, ${c._id}`,
                          );
                          app.openDirectMessage(c);
                        } catch (e) {
                          console.log(
                            `[PROFILE] Error switching to DM: ${c._id}, ${e}`,
                          );
                        }
                      }}>
                      <View
                        style={{
                          alignItems: 'center',
                          flexDirection: 'column',
                        }}>
                        <View>
                          <MaterialIcon
                            name="message"
                            size={25}
                            color={currentTheme.foregroundPrimary}
                          />
                        </View>
                        <Text>Message</Text>
                      </View>
                    </Button>
                  ) : user.relationship === 'Incoming' ? (
                    <>
                      <Button
                        backgroundColor={currentTheme.backgroundPrimary}
                        onPress={() => {
                          user.addFriend();
                        }}>
                        <View
                          style={{
                            alignItems: 'center',
                            flexDirection: 'column',
                          }}>
                          <View>
                            <MaterialCommunityIcon
                              name="account-plus"
                              size={25}
                              color={currentTheme.foregroundPrimary}
                            />
                          </View>
                          <Text>Accept Friend Request</Text>
                        </View>
                      </Button>
                      <Button
                        backgroundColor={currentTheme.backgroundPrimary}
                        onPress={() => {
                          user.removeFriend();
                        }}>
                        <View
                          style={{
                            alignItems: 'center',
                            flexDirection: 'column',
                          }}>
                          <View>
                            <MaterialCommunityIcon
                              name="account-remove"
                              size={25}
                              color={currentTheme.foregroundPrimary}
                            />
                          </View>
                          <Text>Reject Friend Request</Text>
                        </View>
                      </Button>
                    </>
                  ) : user.relationship === 'Outgoing' ? (
                    <Button
                      backgroundColor={currentTheme.backgroundPrimary}
                      style={{marginHorizontal: 0}}
                      onPress={() => {
                        user.removeFriend();
                      }}>
                      <View
                        style={{
                          alignItems: 'center',
                          flexDirection: 'column',
                        }}>
                        <View>
                          <MaterialCommunityIcon
                            name="account-cancel"
                            size={25}
                            color={currentTheme.foregroundPrimary}
                          />
                        </View>
                        <Text>Cancel Friend Request</Text>
                      </View>
                    </Button>
                  ) : user.relationship !== 'Blocked' &&
                    user.relationship !== 'BlockedOther' ? (
                    <Button
                      backgroundColor={currentTheme.backgroundPrimary}
                      style={{marginHorizontal: 0}}
                      onPress={() => {
                        user.addFriend();
                      }}>
                      <View
                        style={{
                          alignItems: 'center',
                          flexDirection: 'column',
                        }}>
                        <View>
                          <MaterialCommunityIcon
                            name="account-plus"
                            size={25}
                            color={currentTheme.foregroundPrimary}
                          />
                        </View>
                        <Text>Send Friend Request</Text>
                      </View>
                    </Button>
                  ) : null
                ) : (
                  <></>
                )}
              </View>
            </View>
            <View style={{flexDirection: 'row'}}>
              <Button
                backgroundColor={currentTheme.backgroundPrimary}
                style={{
                  padding: 8,
                  margin: 3,
                  flex: 1,
                }}
                onPress={() => setSection('Profile')}>
                <Text>Profile</Text>
              </Button>
              <Button
                backgroundColor={currentTheme.backgroundPrimary}
                style={{
                  padding: 8,
                  margin: 3,
                  flex: 1,
                }}
                onPress={() => setSection('Mutual Friends')}>
                <Text>Mutual Friends</Text>
              </Button>
            </View>
            <View style={{flexDirection: 'row'}}>
              <Button
                backgroundColor={currentTheme.backgroundPrimary}
                style={{
                  padding: 8,
                  margin: 3,
                  flex: 1,
                }}
                onPress={() => setSection('Mutual Servers')}>
                <Text>Mutual Servers</Text>
              </Button>
            </View>
          </>
        ) : null}
        {section === 'Profile' ? (
          <ScrollView>
            {user.relationship === 'User' ? (
              <>
                <Text type={'profile'}>STATUS</Text>
                <Text key={'profile-status-menu-notice'}>
                  Status settings have moved.
                </Text>
                <View style={{flexDirection: 'row'}}>
                  <ContextButton
                    key={'profile-status-menu-button'}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 3,
                    }}
                    onPress={() => {
                      app.openStatusMenu(true);
                    }}>
                    <Text key={'profile-status-menu-button-label'}>
                      Open status menu
                    </Text>
                  </ContextButton>
                </View>
              </>
            ) : user.bot ? (
              <>
                <Text type={'profile'}>BOT OWNER</Text>
                {user.bot.owner && client.users.get(user.bot.owner) ? (
                  <Button
                    style={{
                      marginHorizontal: 0,
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      backgroundColor: currentTheme.backgroundPrimary,
                    }}
                    onPress={async () => {
                      app.openProfile(client.users.get(user.bot!.owner));
                    }}>
                    <View style={{maxWidth: '90%'}}>
                      <MiniProfile user={client.users.get(user.bot.owner)} />
                    </View>
                  </Button>
                ) : (
                  <Text style={{color: currentTheme.foregroundSecondary}}>
                    Unloaded user
                  </Text>
                )}
              </>
            ) : null}
            {server && <RoleView user={user} server={server} />}
            {user.badges ? (
              <>
                <View style={{flexDirection: 'row'}}>
                  <Text type={'profile'}>BADGES {'('}</Text>
                  <Link
                    link={'https://support.revolt.chat/kb/account/badges'}
                    label={'learn more'}
                    style={{marginVertical: 5, fontWeight: 'bold'}}
                  />
                  <Text type={'profile'}>{')'}</Text>
                </View>
                <ScrollView
                  style={{
                    flexDirection: 'row',
                    height: 38,
                    marginVertical: 2,
                  }}
                  contentContainerStyle={{alignItems: 'center'}}
                  horizontal={true}>
                  <>
                    {Object.keys(BADGES).map(b => {
                      if (user.badges! & BADGES[b]) {
                        return (
                          <View
                            style={{
                              height: 32,
                              width: 32,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 8,
                            }}
                            key={b}>
                            {(() => {
                              switch (b) {
                                case 'Founder':
                                  return (
                                    <TouchableOpacity
                                      onPress={() => showToast('Founder')}>
                                      <FA5Icon
                                        name="star"
                                        size={28}
                                        color={'red'}
                                      />
                                    </TouchableOpacity>
                                  );
                                case 'Developer':
                                  return (
                                    <TouchableOpacity
                                      onPress={() =>
                                        showToast('Revolt Developer')
                                      }>
                                      <FA5Icon
                                        name="wrench"
                                        size={28}
                                        color={currentTheme.foregroundSecondary}
                                      />
                                    </TouchableOpacity>
                                  );
                                case 'Translator':
                                  return (
                                    <TouchableOpacity
                                      onPress={() => showToast('Translator')}>
                                      <MaterialIcon
                                        name="translate"
                                        size={28}
                                        color={'green'}
                                      />
                                    </TouchableOpacity>
                                  );
                                case 'Supporter':
                                  return (
                                    <TouchableOpacity
                                      onPress={() => showToast('Donator')}
                                      onLongPress={() =>
                                        openUrl('https://insrt.uk/donate')
                                      }>
                                      <FA5Icon
                                        name="money-bill"
                                        size={24}
                                        color={'#80c95b'}
                                      />
                                    </TouchableOpacity>
                                  );
                                case 'ResponsibleDisclosure':
                                  return (
                                    <TouchableOpacity
                                      onPress={() =>
                                        showToast(
                                          'Responisbly disclosed a security issue',
                                        )
                                      }>
                                      <FA5Icon
                                        name="shield-alt"
                                        size={28}
                                        color={'pink'}
                                      />
                                    </TouchableOpacity>
                                  );
                                case 'EarlyAdopter':
                                  return (
                                    <TouchableOpacity
                                      onPress={() =>
                                        showToast('Early Adopter')
                                      }>
                                      <MaterialCommunityIcon
                                        name="beta"
                                        size={28}
                                        color={'cyan'}
                                      />
                                    </TouchableOpacity>
                                  );
                                case 'PlatformModeration':
                                  return (
                                    <TouchableOpacity
                                      onPress={() =>
                                        showToast('Platform Moderator')
                                      }>
                                      <FA5Icon
                                        name="gavel"
                                        size={28}
                                        color={'red'}
                                      />
                                    </TouchableOpacity>
                                  );
                                case 'Paw':
                                  return (
                                    <TouchableOpacity
                                      onPress={() => showToast("Insert's Paw")}>
                                      <Text style={{fontSize: 24}}>✌️</Text>
                                    </TouchableOpacity>
                                  );
                                case 'ReservedRelevantJokeBadge1':
                                  return (
                                    <TouchableOpacity
                                      onPress={() => showToast('amogus')}>
                                      <Text style={{fontSize: 24}}>📮</Text>
                                    </TouchableOpacity>
                                  );
                                case 'ReservedRelevantJokeBadge2':
                                  return (
                                    <TouchableOpacity
                                      onPress={() =>
                                        showToast("It's Morbin Time")
                                      }>
                                      <Text style={{fontSize: 24}}>🦇</Text>
                                    </TouchableOpacity>
                                  );
                                default:
                                  return (
                                    <TouchableOpacity
                                      onPress={() => showToast(b)}>
                                      <Text
                                        style={{
                                          color:
                                            currentTheme.foregroundSecondary,
                                          fontSize: 8,
                                        }}>
                                        [{b}]
                                      </Text>
                                    </TouchableOpacity>
                                  );
                              }
                            })()}
                          </View>
                        );
                      }
                    })}
                    {USER_IDS.developers.includes(user._id) ? (
                      <TouchableOpacity
                        onPress={() => showToast('RVMob Developer')}>
                        <View
                          style={{
                            borderRadius: 3,
                            backgroundColor: currentTheme.accentColor,
                            height: 21,
                            padding: 4,
                          }}>
                          <Text
                            style={{
                              color: currentTheme.accentColorForeground,
                              fontWeight: 'bold',
                              fontSize: 16,
                              marginTop: -5,
                              marginLeft: -1,
                            }}>
                            RV
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                    {user._id === USER_IDS.teamMembers.lea ? (
                      <TouchableOpacity onPress={() => showToast("Lea's Paw")}>
                        <View
                          style={{
                            height: 32,
                            width: 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 8,
                          }}
                          key={'lea-paw'}>
                          <MaterialCommunityIcon
                            name={'paw'}
                            size={28}
                            color={currentTheme.foregroundSecondary}
                          />
                        </View>
                      </TouchableOpacity>
                    ) : null}
                    {user._id === USER_IDS.teamMembers.insert ? (
                      <TouchableOpacity onPress={() => showToast('raccoon 🦝')}>
                        <View
                          style={{
                            height: 32,
                            width: 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 8,
                          }}
                          key={'insert-raccoon'}>
                          <Text style={{fontSize: 24}}>🦝</Text>
                          {/* <Image
                            style={{height: 20, width: 20}}
                            source={{
                              uri: 'https://app.revolt.chat/assets/badges/raccoon.svg',
                            }}
                          /> */}
                        </View>
                      </TouchableOpacity>
                    ) : null}
                    {user._id === USER_IDS.teamMembers.infi ? (
                      <TouchableOpacity onPress={() => showToast('ink-fi')}>
                        <View
                          style={{
                            height: 32,
                            width: 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 8,
                          }}
                          key={'infi-octopus'}>
                          <Text style={{fontSize: 24}}>🐙</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                  </>
                </ScrollView>
              </>
            ) : null}
            <Text type={'profile'}>BIO</Text>
            {profile.content ? (
              <MarkdownView>{parseRevoltNodes(profile.content)}</MarkdownView>
            ) : null}
            <View style={{marginTop: 10}} />
          </ScrollView>
        ) : section === 'Mutual Servers' ? (
          <ScrollView>
            <Text type={'profile'}>MUTUAL SERVERS</Text>
            {mutual.servers?.map(srv => {
              return (
                <ContextButton
                  key={srv!._id}
                  onPress={() => {
                    app.openServer(srv);
                    app.openProfile(null);
                    app.openLeftMenu(true);
                  }}>
                  <GeneralAvatar attachment={srv!.icon} size={32} />
                  <Text style={{fontWeight: 'bold', marginLeft: 6}}>
                    {srv!.name}
                  </Text>
                </ContextButton>
              );
            })}
            <View style={{marginTop: 10}} />
          </ScrollView>
        ) : section === 'Mutual Friends' ? (
          <ScrollView>
            <Text type={'profile'}>MUTUAL FRIENDS</Text>
            <UserList users={mutual.users} />
            <View style={{marginTop: 10}} />
          </ScrollView>
        ) : null}
      </ScrollView>
    );
  },
);
