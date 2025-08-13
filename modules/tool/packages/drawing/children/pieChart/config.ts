import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '饼图',
    en: 'Pie Chart'
  },
  description: {
    'zh-CN': '生成饼图，支持普通、环形、漏斗三种类型，适用于占比数据展示',
    en: 'Generate pie charts with normal, donut, and funnel types for proportion data visualization'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'v2.0 架构：简化工具 + 占比可视化',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'title',
          label: '图表标题',
          description: '图表的标题',
          toolDescription: '图表的标题'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'categories',
          label: '分类名称',
          description: '各个分类的名称，例如：["产品A", "产品B", "产品C"]',
          required: true,
          toolDescription: '饼图各个扇区的分类名称'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'values',
          label: '数值数据',
          description: '对应各分类的数值，例如：[30, 25, 45]',
          required: true,
          toolDescription: '各分类对应的数值，将自动计算占比'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'chartSubType',
          label: '饼图类型',
          description: '选择饼图的子类型',
          required: false,
          defaultValue: 'normal',
          list: [
            {
              label: '普通饼图',
              value: 'normal'
            },
            {
              label: '环形图',
              value: 'donut'
            },
            {
              label: '漏斗图',
              value: 'funnel'
            }
          ],
          toolDescription: '饼图类型：normal(普通), donut(环形), funnel(漏斗)'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'innerRadius',
          label: '内径大小',
          description: '内径大小（0-0.8），普通饼图默认0，环形图默认0.4',
          required: false,
          toolDescription: '内径比例，控制中心空洞大小，普通饼图默认0，环形图默认0.4'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.boolean,
          key: 'showPercentage',
          label: '显示百分比',
          description: '是否在标签中显示百分比',
          required: false,
          defaultValue: true,
          toolDescription: '是否在扇区标签中显示百分比'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.boolean,
          key: 'showValue',
          label: '显示数值',
          description: '是否在标签中显示原始数值',
          required: false,
          defaultValue: false,
          toolDescription: '是否在扇区标签中显示原始数值'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'labelPosition',
          label: '标签位置',
          description: '选择标签显示位置',
          required: false,
          defaultValue: 'outside',
          list: [
            {
              label: '外部显示',
              value: 'outside'
            },
            {
              label: '内部显示',
              value: 'inside'
            },
            {
              label: '不显示标签',
              value: 'none'
            }
          ],
          toolDescription: '标签位置：outside, inside, none'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'colorScheme',
          label: '颜色方案',
          description: '选择图表的配色方案',
          required: false,
          defaultValue: 'blue',
          list: [
            {
              label: '蓝色系',
              value: 'blue'
            },
            {
              label: '绿色系',
              value: 'green'
            },
            {
              label: '暖色系',
              value: 'warm'
            },
            {
              label: '冷色系',
              value: 'cool'
            },
            {
              label: '紫色系',
              value: 'purple'
            }
          ],
          toolDescription: '图表配色方案：blue, green, warm, cool, purple'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'chartSize',
          label: '图表尺寸',
          description: '选择图表尺寸',
          required: false,
          defaultValue: 'medium',
          list: [
            {
              label: '小型 (400x300)',
              value: 'small'
            },
            {
              label: '中型 (600x450)',
              value: 'medium'
            },
            {
              label: '大型 (800x600)',
              value: 'large'
            }
          ],
          toolDescription: '图表尺寸：small(400x300), medium(600x450), large(800x600)'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'legendPosition',
          label: '图例位置',
          description: '选择图例显示位置',
          required: false,
          defaultValue: 'right',
          list: [
            {
              label: '顶部',
              value: 'top'
            },
            {
              label: '右侧',
              value: 'right'
            },
            {
              label: '底部',
              value: 'bottom'
            },
            {
              label: '左侧',
              value: 'left'
            },
            {
              label: '不显示',
              value: 'none'
            }
          ],
          toolDescription: '图例位置：top, right, bottom, left, none'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: '生成的饼图URL，可用markdown格式展示：![图片](url)',
          defaultValue: '',
          label: '图表URL',
          key: 'chartUrl'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: 'ECharts配置JSON，用于调试和二次开发',
          defaultValue: '',
          label: 'ECharts配置',
          key: 'echartsConfig'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: '数据统计信息和占比分析',
          defaultValue: '',
          label: '统计信息',
          key: 'statisticsInfo'
        }
      ]
    }
  ]
});
